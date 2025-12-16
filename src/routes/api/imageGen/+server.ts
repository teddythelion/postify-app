import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

interface GenerateImageResult {
    image: {
        base64: string;
        uint8Array: Uint8Array;
    };
}

export async function POST({ request }: { request: Request }) {
    try {
        const body = await request.json().catch(() => ({}));
         console.log('body');
         console.log('***********************');
        const schema = z.object({ prompt: z.string().min(1).optional() }).strict();
        console.log('schema');
        console.log(schema);
        const { prompt = 'Santa Claus driving a Cadillac' } = schema.parse(body);
        console.log('prompt');
        console.log(prompt);
        const result = await generateImage({
            model: openai.image('dall-e-3'),
            prompt,
            size: '1024x1024',
            providerOptions: {
                openai: { style: 'vivid', quality: 'hd' },
            },
        });

        const { image } = result as GenerateImageResult;

        if (!image || !image.base64) {
            throw new Error('No image returned from provider');
        }

        return new Response(JSON.stringify({ imageBase64: image.base64 }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Image generation error:', err);
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

/*(alias) function experimental_generateImage({ model: modelArg, prompt, n, maxImagesPerCall, size, aspectRatio, seed, providerOptions, maxRetries: maxRetriesArg, abortSignal, headers, }: {
    model: ImageModel;
    prompt: string;
    n?: number;
    maxImagesPerCall?: number;
    size?: `${number}x${number}`;
    aspectRatio?: `${number}:${number}`;
    seed?: number;
    providerOptions?: ProviderOptions;
    maxRetries?: number;
    abortSignal?: AbortSignal;
    headers?: Record<string, string>;
}): Promise<GenerateImageResult>
export experimental_generateImage
Generates images using an image model.

@param model — The image model to use.

@param prompt — The prompt that should be used to generate the image.

@param n — Number of images to generate. Default: 1.

@param size — Size of the images to generate. Must have the format {width}x{height}.

@param aspectRatio — Aspect ratio of the images to generate. Must have the format {width}:{height}.

@param seed — Seed for the image generation.

@param providerOptions
Additional provider-specific options that are passed through to the provider as body parameters.

@param maxRetries — Maximum number of retries. Set to 0 to disable retries. Default: 2.

@param abortSignal — An optional abort signal that can be used to cancel the call.

@param headers — Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.

@returns — A result object that contains the generated images. */