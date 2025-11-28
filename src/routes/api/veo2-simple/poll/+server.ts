import { GoogleAuth } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';
import { readFileSync } from 'fs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { operation } = await request.json();
    
    const key = JSON.parse(readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    const auth = new GoogleAuth({ 
        credentials: key, 
        scopes: ['https://www.googleapis.com/auth/cloud-platform'] 
    });
    const token = (await (await auth.getClient()).getAccessToken()).token;

    const modelId = 'veo-2.0-generate-001';

    const res = await fetch(
        `https://us-central1-aiplatform.googleapis.com/v1/projects/${env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/${modelId}:fetchPredictOperation`,
        {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operationName: operation
            })
        }
    );

    if (!res.ok) {
        console.error('Polling failed:', res.status, res.statusText);
        const text = await res.text();
        console.error('Error response:', text);
        return new Response(JSON.stringify({ 
            done: false, 
            error: `Polling failed: ${res.status}` 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    const data = await res.json();
    console.log('POLL RESPONSE *********************');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.done) {
        const gcsUri = data.response?.videos?.[0]?.gcsUri;
        
        if (!gcsUri) {
            console.error('No GCS URI found in response');
            return new Response(JSON.stringify({ 
                done: true, 
                error: 'No video generated' 
            }), { 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        console.log('GCS URI:', gcsUri);

        // Parse GCS URI: gs://bucket-name/path/to/file.mp4
        const match = gcsUri.match(/gs:\/\/([^\/]+)\/(.+)/);
        if (!match) {
            console.error('Invalid GCS URI format:', gcsUri);
            return new Response(JSON.stringify({ 
                done: true, 
                video: gcsUri 
            }), { 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const bucketName = match[1];
        const filePath = match[2];

        // Generate signed URL (valid for 1 hour)
        const storage = new Storage({ credentials: key });
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(filePath);

        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 3600000, // 1 hour
        });

        console.log('Signed URL:', signedUrl);

        return new Response(JSON.stringify({ 
            done: true, 
            video: signedUrl 
        }), { 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    return new Response(JSON.stringify({ done: false }), { 
        headers: { 'Content-Type': 'application/json' } 
    });
};