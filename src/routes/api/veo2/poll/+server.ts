import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { operationName } = await request.json();

        const serviceAccountKey = JSON.parse(readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
        const auth = new GoogleAuth({ credentials: serviceAccountKey, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const location = env.GOOGLE_LOCATION || 'us-central1';
        const url = `https://${location}-aiplatform.googleapis.com/v1/${operationName}`;
        
        console.log('[Poll] URL:', url);
        
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken.token}` } });
        const text = await response.text();
        
        console.log('[Poll] Status:', response.status);
        console.log('[Poll] Response:', text.substring(0, 500));

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
        }

        const data = JSON.parse(text);

        if (data.done) {
            const videos = (data.response?.predictions || []).map((p: any, i: number) => ({ 
                url: p.bytesBase64Encoded || p.videoUri || p.gcsUri, 
                index: i 
            }));
            return new Response(JSON.stringify({ status: 'complete', videos }), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ status: 'processing' }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('[Poll] Error:', error);
        return new Response(JSON.stringify({ status: 'error', error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}