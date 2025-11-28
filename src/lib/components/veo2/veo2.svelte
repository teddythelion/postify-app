<script lang="ts">
    import { onDestroy } from 'svelte';

    let prompt = '';
    let aspectRatio: '16:9' | '9:16' | '1:1' = '16:9';
    let numberOfVideos = 1;
    let isGenerating = false;
    let generatedVideos: Array<{ url: string; index: number }> = [];
    let error = '';
    let progress = '';
    let requestId = '';
    let operationName = '';
    let pollAttempts = 0;
    let pollInterval: number | null = null;
    let currentDelay = 3000;

    // Enhanced backoff configuration
    const INITIAL_POLL_DELAY = 15000; // Start at 5 seconds (more conservative)
    const MAX_POLL_DELAY = 30000;
    const MAX_POLL_ATTEMPTS = 40;
    const RATE_LIMIT_BACKOFF = 60000; // 60 seconds on 429

    function generateRequestId() {
       return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
    
    console.log('generateRequestId()');
    console.log(generateRequestId());
    function calculateBackoffDelay(attempt: number, wasRateLimited = false): number {
        if (wasRateLimited) {
            return RATE_LIMIT_BACKOFF;
        }
        
        // Slower exponential backoff: 5s, 10s, 15s, 20s, 25s, 30s (capped)
        const delay = Math.min(
            INITIAL_POLL_DELAY + (attempt * 5000),
            MAX_POLL_DELAY
        );
        
        console.log(`[Poll] Next poll in ${delay / 1000}s (attempt ${attempt + 1})`);
        return delay;
    }

    function stopPolling() {
        if (pollInterval) {
            clearTimeout(pollInterval);
            pollInterval = null;
        }
    }

    async function pollOperationStatus() {
        if (!operationName || pollAttempts >= MAX_POLL_ATTEMPTS) {
            if (pollAttempts >= MAX_POLL_ATTEMPTS) {
                error = 'Video generation timed out. Please try again later.';
                isGenerating = false;
            }
            stopPolling();
            return;
        }

        try {
            console.log(`[Poll] Status check ${pollAttempts + 1}/${MAX_POLL_ATTEMPTS}`);
            
            const response = await fetch('/api/veo2/poll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ operationName })
            });

            const data = await response.json();

            // Handle 429 rate limiting
            if (response.status === 429 || data.status === 'rate_limited') {
                console.warn('[Poll] ⚠️  Rate limited, backing off...');
                progress = 'Rate limit hit - waiting 60 seconds...';
                currentDelay = RATE_LIMIT_BACKOFF;
                
                pollInterval = setTimeout(() => {
                    pollOperationStatus();
                }, 15000) as any;
                return;
            }

            if (data.status === 'complete') {
                progress = 'Video generated successfully!';
                generatedVideos = data.videos || [];
                isGenerating = false;
                stopPolling();
                pollAttempts = 0;
                console.log('[Poll] ✅ Complete!');
            } else if (data.status === 'error') {
                error = `Generation failed: ${JSON.stringify(data.error)}`;
                isGenerating = false;
                stopPolling();
                pollAttempts = 0;
            } else if (data.status === 'processing') {
                progress = `Generating... (check ${pollAttempts + 1}/${MAX_POLL_ATTEMPTS})`;
                pollAttempts++;
                
                console.log('pollAttempts++');
                console.log(pollAttempts++);
    
                currentDelay = calculateBackoffDelay(pollAttempts);
                pollInterval = setTimeout(() => {
                    pollOperationStatus();
                }, currentDelay) as any;
            }

        } catch (err) {
            console.error('[Poll] Error:', err);
            
            // On error, wait longer before retry
            pollAttempts++;
            currentDelay = calculateBackoffDelay(pollAttempts, true);
            
            if (pollAttempts < MAX_POLL_ATTEMPTS) {
                progress = `Error checking status, retrying in ${currentDelay / 1000}s...`;
                pollInterval = setTimeout(() => {
                    pollOperationStatus();
                }, currentDelay) as any;
            } else {
                error = 'Failed to check video status';
                isGenerating = false;
                stopPolling();
            }
        }
    }

    async function generateVideo() {
        if (!prompt.trim()) {
            error = 'Please enter a prompt';
            return;
        }

        if (isGenerating) {
            console.warn('[Generate] Already generating, preventing duplicate');
            return;
        }

        isGenerating = true;
        error = '';
        generatedVideos = [];
        progress = 'Queuing video generation...';
        pollAttempts = 0;
        requestId = generateRequestId();
        currentDelay = INITIAL_POLL_DELAY;

        console.log(`[Generate] 🎬 Request: ${requestId}`);

        try {
            const response = await fetch('/api/veo2/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    aspectRatio,
                    numberOfVideos,
                    requestId
                })
            });

            const data = await response.json();

            // Handle 429 on generation
            if (response.status === 429) {
                error = '⚠️ Rate limit exceeded. Please wait 60 seconds and try again.';
                isGenerating = false;
                console.error('[Generate] 429 on generate endpoint');
                return;
            }

            // Handle 503 (server busy)
            if (response.status === 503) {
                error = `Server is busy (queue: ${data.queueLength}). Please try again in a few minutes.`;
                isGenerating = false;
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate video');
            }

            if (data.isExisting) {
                console.log('[Generate] Using existing operation');
                progress = 'Resuming generation...';
            } else {
                console.log('[Generate] ✨ New operation created');
                progress = 'Video generation started!';
            }

            operationName = data.operationName;

            // Start polling with initial delay
            pollInterval = setTimeout(() => {
                pollOperationStatus();
            }, INITIAL_POLL_DELAY) as any;

        } catch (err) {
            console.error('[Generate] Error:', err);
            error = err instanceof Error ? err.message : 'An error occurred';
            isGenerating = false;
        }
    }

    function downloadVideo(url: string, index: number) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `veo2-video-${index + 1}.mp4`;
        a.click();
    }

    function reset() {
        stopPolling();
        prompt = '';
        generatedVideos = [];
        error = '';
        progress = '';
        operationName = '';
        pollAttempts = 0;
        isGenerating = false;
        currentDelay = INITIAL_POLL_DELAY;
    }

    onDestroy(() => {
        stopPolling();
    });
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="text-center space-y-2">
        <h1 class="text-4xl font-bold text-gray-200">Veo 2 Video Generator</h1>
        <p class="text-gray-200">Protected against 429 rate limit errors</p>
    </div>

    <!-- Rate Limit Warning Banner -->
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
            </div>
            <div class="ml-3">
                <p class="text-sm text-yellow-700">
                    <strong>Rate Limit Protection:</strong> This app includes automatic retry logic, request queuing, and exponential backoff to prevent 429 errors and extra charges.
                </p>
            </div>
        </div>
    </div>

    <!-- Input Form -->
    <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
            <label for="prompt" class="block text-sm font-medium text-gray-700 mb-2">
                Video Prompt
            </label>
            <textarea
                id="prompt"
                bind:value={prompt}
                placeholder="Describe the video you want to generate..."
                rows="4"
                class="w-full text-gray-800 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isGenerating}
            ></textarea>
        </div>

        <div>
            <span class="block text-sm font-medium text-gray-700 mb-2">
                Aspect Ratio
            </span>
            <div class="flex gap-3">
                <label class="flex items-center cursor-pointer">
                    <input
                        type="radio"
                        bind:group={aspectRatio}
                        value="16:9"
                        disabled={isGenerating}
                        class="mr-2"
                    />
                    <span class="text-sm">16:9</span>
                </label>
                <label class="flex items-center cursor-pointer">
                    <input
                        type="radio"
                        bind:group={aspectRatio}
                        value="9:16"
                        disabled={isGenerating}
                        class="mr-2"
                    />
                    <span class="text-sm">9:16</span>
                </label>
                <label class="flex items-center cursor-pointer">
                    <input
                        type="radio"
                        bind:group={aspectRatio}
                        value="1:1"
                        disabled={isGenerating}
                        class="mr-2"
                    />
                    <span class="text-sm">1:1</span>
                </label>
            </div>
        </div>

        <div>
            <label for="numberOfVideos" class="block text-sm font-medium text-gray-700 mb-2">
                Number of Videos (1-4)
            </label>
            <input
                id="numberOfVideos"
                type="number"
                bind:value={numberOfVideos}
                min="1"
                max="1"
                disabled={isGenerating}
                class="w-32 text-gray-700 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <button
            on:click={generateVideo}
            disabled={isGenerating || !prompt.trim()}
            class="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
            {#if isGenerating}
                <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                </span>
            {:else}
                Generate Video
            {/if}
        </button>

        {#if isGenerating}
            <div class="text-xs text-center space-y-1">
                <p class="text-gray-600">🔒 Click protection active</p>
                <p class="text-gray-500">Next status check in {Math.round(currentDelay / 1000)}s</p>
            </div>
        {/if}
    </div>

    {#if progress}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center gap-3">
                <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-blue-800">{progress}</p>
            </div>
        </div>
    {/if}
    {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{error}</p>
    </div>
    {/if}

    {#if generatedVideos.length > 0}
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h2 class="text-2xl font-semibold text-gray-900">Generated Videos</h2>
            <button
                on:click={reset}
                class="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
                Generate New
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each generatedVideos as video}
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="aspect-video bg-gray-100">
                       <!-- svelte-ignore a11y_media_has_caption -->
                    <video
                        src={video.url}
                        controls
                        class="w-full h-full object-contain"
                        preload="metadata"
                    >
                        Your browser does not support the video tag.
                    </video>
                    </div>
                    <div class="p-4 flex items-center justify-between">
                        <span class="text-sm text-gray-600">Video {video.index + 1}</span>
                        <button
                            on:click={() => downloadVideo(video.url, video.index)}
                            class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                            Download
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    </div>
    {/if}

    <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p class="font-medium mb-2">🛡️ 429 Protection Features:</p>
        <ul class="list-disc list-inside space-y-1">
            <li>Request queue with 2-second minimum intervals</li>
            <li>Automatic retry with exponential backoff (up to 5 retries)</li>
            <li>Rate limit tracking (max 10 requests/minute)</li>
            <li>Duplicate request prevention</li>
            <li>Conservative polling (starts at 5 seconds)</li>
            <li>60-second backoff on 429 errors</li>
            <li>Server queue limit (max 5 pending)</li>
        </ul>
    </div>
</div>