import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function POST({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string | null;

    // Collect all uploaded images (formData can have multiple "images")
    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        imageFiles.push(value);
      }
    }
    console.log('imagefiles');
    console.log('result*******************************************');
    if (imageFiles.length === 0 || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing images or prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI with multiple images
    const result = await openai.images.edit({
      model: 'gpt-image-1',
      // Pass array of images
      image: imageFiles,
      prompt,
      // Optional: request multiple outputs (up to 5)
      n: 1
    });

    console.log('OpenAI raw result:', JSON.stringify(result, null, 2));

    if (!result.data || result.data.length === 0) {
      throw new Error('No images returned from OpenAI');
    }
console.log(result);
console.log('result*******************************************');
    // Normalize results: always return array of URLs or base64
    const imageUrls = result.data.map((item) => {
      if (item.url) return item.url;
      if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
      return null;
    }).filter(Boolean);

    if (imageUrls.length === 0) {
      throw new Error('No usable images returned from OpenAI');
    }
    console.log(imageUrls);
    console.log('imageUrls*******************************************');
    return new Response(JSON.stringify({ imageUrls }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('ImageEdit error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
