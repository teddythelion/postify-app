import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Request queue to prevent simultaneous API calls
class RequestQueue {
    private queue: Array<() => Promise<void>> = [];
    private processing = false;
    private lastRequestTime = 0;
    private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
    private requestCount = 0;
    private resetTime = Date.now();
    private readonly MAX_REQUESTS_PER_MINUTE = 10; // Adjust based on your quota

    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.process();
        });
    }

    private async process() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        while (this.queue.length > 0) {
            // Check rate limit
            const now = Date.now();
            if (now - this.resetTime > 60000) {
                // Reset counter every minute
                this.requestCount = 0;
                this.resetTime = now;
            }

            if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
                console.log('[Queue] Rate limit reached, waiting 60 seconds...');
                await this.sleep(60000);
                this.requestCount = 0;
                this.resetTime = Date.now();
            }

            // Enforce minimum interval between requests
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
                await this.sleep(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
            }

            const task = this.queue.shift();
            if (task) {
                this.lastRequestTime = Date.now();
                this.requestCount++;
                console.log(`[Queue] Processing request (${this.requestCount}/${this.MAX_REQUESTS_PER_MINUTE} this minute)`);
                await task();
            }
        }

        this.processing = false;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    getRequestCount(): number {
        return this.requestCount;
    }
}

// Global queue instance
const requestQueue = new RequestQueue();

// In-memory store to track active operations
const activeOperations = new Map<string, { 
    operationName: string; 
    timestamp: number;
    requestId: string;
    retryCount: number;
}>();

// Exponential backoff retry logic
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    initialDelay = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const errorMessage = error?.message || JSON.stringify(error);

            // Check if it's a 429 error
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                const delay = initialDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
                const totalDelay = delay + jitter;

                console.log(`[Retry] 429 Error - Attempt ${attempt + 1}/${maxRetries}, waiting ${Math.round(totalDelay / 1000)}s`);
                
                await new Promise(resolve => setTimeout(resolve, totalDelay));
                continue;
            }

            // If it's not a 429, throw immediately
            throw error;
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

function cleanupOldOperations() {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of activeOperations.entries()) {
        if (value.timestamp < tenMinutesAgo) {
            activeOperations.delete(key);
        }
    }
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { prompt, aspectRatio = '16:9', numberOfVideos = 1, requestId } = await request.json();

        if (!prompt || !prompt.trim()) {
            return new Response(JSON.stringify({ 
                error: 'Prompt is required' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate unique key for deduplication
        const requestKey = requestId || `${prompt.slice(0, 50)}-${aspectRatio}-${numberOfVideos}-${Date.now()}`;
        
        cleanupOldOperations();

        // Check if duplicate request
        if (activeOperations.has(requestKey)) {
            const existing = activeOperations.get(requestKey)!;
            console.log(`[Veo2] Duplicate request detected: ${requestKey}`);
            return new Response(JSON.stringify({ 
                message: 'Request already in progress',
                operationName: existing.operationName,
                requestId: existing.requestId,
                isExisting: true,
                queueLength: requestQueue.getQueueLength()
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // Check queue status
        const queueLength = requestQueue.getQueueLength();
        if (queueLength > 5) {
            return new Response(JSON.stringify({ 
                error: 'Server is currently busy. Please try again in a few minutes.',
                queueLength
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log(`[Veo2] New request queued: ${requestKey} (Queue: ${queueLength})`);

        // Add to queue with retry logic
        const result = await requestQueue.add(async () => {
            return await retryWithBackoff(async () => {
                // Read service account credentials
                const serviceAccountKey = JSON.parse(
                    readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
                );

                // Initialize Google Auth
                const auth = new GoogleAuth({
                    credentials: serviceAccountKey,
                    scopes: ['https://www.googleapis.com/auth/cloud-platform']
                });

                const client = await auth.getClient();
                const accessToken = await client.getAccessToken();

                if (!accessToken.token) {
                    throw new Error('Failed to get access token');
                }

                const projectId = env.GOOGLE_PROJECT_ID;
                const location = env.GOOGLE_LOCATION || 'us-central1';
                const model = 'veo-2.0-generate-001';

                const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;

                console.log(`[Veo2] 🎬 Making API call for: ${requestKey}`);

                // THE ONLY CHARGED API CALL
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken.token}`,
                        'Content-Type': 'application/json',
                        'X-Goog-User-Project': projectId // Help with quota attribution
                    },
                    body: JSON.stringify({
                        instances: [
                            {
                                prompt: prompt.trim()
                            }
                        ],
                        parameters: {
                            aspectRatio: aspectRatio,
                            sampleCount: numberOfVideos,
                             storageUri: `gs://${env.GOOGLE_STORAGE_BUCKET}/veo2-videos/`, // Add folder path
                             durationSeconds: 6,
                             

                        }
                    })
                });

                const responseText = await response.text();
                
                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = JSON.parse(responseText);
                    } catch {
                        errorData = { message: responseText };
                    }

                    const errorMessage = errorData.error?.message || errorData.message || responseText;
                    
                    // Check for 429 specifically
                    if (response.status === 429 || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                        console.error('[Veo2] 429 RESOURCE_EXHAUSTED - Will retry...');
                        throw new Error('429 RESOURCE_EXHAUSTED: ' + errorMessage);
                    }

                    throw new Error(`Veo API error (${response.status}): ${errorMessage}`);
                }

                const data = JSON.parse(responseText);
                return data;
            }, 5, 2000); // 5 retries, starting with 2 second delay
        });

        const operationName = result.name;
        console.log(`[Veo2] ✅ Operation started successfully: ${operationName}`);

        // Store operation
        activeOperations.set(requestKey, {
            operationName,
            timestamp: Date.now(),
            requestId: requestKey,
            retryCount: 0
        });

        return new Response(JSON.stringify({ 
            operationName,
            requestId: requestKey,
            message: 'Video generation started. Use the poll endpoint to check status.',
            estimatedTime: '1-3 minutes',
            queueLength: requestQueue.getQueueLength(),
            requestsThisMinute: requestQueue.getRequestCount()
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('[Veo2] Video generation error:', error);
        
        const errorMessage = error?.message || 'Unknown error';
        const is429 = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');

        return new Response(JSON.stringify({ 
            error: is429 
                ? 'Rate limit exceeded. Please wait a moment and try again.'
                : (error instanceof Error ? error.message : 'Failed to generate video with Veo 2'),
            is429Error: is429,
            retryAfter: is429 ? 60 : undefined, // Suggest waiting 60 seconds
            details: error instanceof Error ? error.stack : undefined
        }), {
            status: is429 ? 429 : 500,
            headers: { 
                'Content-Type': 'application/json',
                ...(is429 ? { 'Retry-After': '60' } : {})
            }
        });
    }
}