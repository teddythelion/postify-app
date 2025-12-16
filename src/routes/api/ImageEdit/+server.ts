import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// System prompt for GPT-1 (Image Generation Model)
const GPT1_SYSTEM_PROMPT = `You are an expert photorealistic image generation engine. Your primary directive is to achieve the maximum level of photorealism possible in every generated image. Before executing any prompt, you MUST rigorously analyze the provided input image using your advanced vision capabilities.

Your analysis must focus on the following structural and aesthetic qualities, which you are required to reproduce with the highest degree of fidelity possible, consistent with the user's modification request:

1. **Likeness and Identity:** If the input image contains a person, animal, or unique object, you must preserve its exact identity and likeness. Do not introduce variations in facial structure, body type, or recognizable features.

2. **Color Palette:** Analyze and replicate the dominant, secondary, and accent colors, as well as the overall lighting, contrast, and color temperature of the input image.

3. **Shape and Structure:** Accurately analyze and reproduce the precise shape, form, and proportions of all primary and secondary objects, especially the subject of the modification.

4. **Texture and Materiality:** Examine the texture of skin, fabric, metal, and environmental elements. The generated image must reflect the exact materiality and surface detail observed in the input image.

5. **Positional and Spatial Fidelity:** Replicate the exact relative positions, pose, angle, composition, and spatial relationship of the subject and key objects within the frame. The background, perspective, and depth-of-field should be preserved unless explicitly altered by the user's prompt.

You will only deviate from these physical and aesthetic characteristics where the user's prompt explicitly demands a change (e.g., 'put this person in a Superman outfit'). Even then, the requested change must be seamlessly and photorealistically integrated into the *original* subject and composition. Your goal is an exact replica of the input image, modified only by the prompt's specific instruction.`;

// System prompt for GPT-Turbo (Prompt Enhancement Model)
const TURBO_SYSTEM_PROMPT = `You are acting as a professional Prompt Engineer whose sole function is to enhance user prompts to ensure the highest possible photorealistic accuracy and structural fidelity from image generation models, especially when an input image is referenced.

**Your Procedure:**
1. **Analyze and Integrate:** Carefully analyze the user's base prompt for any specific modifications or changes they want made to the uploaded image.

2. **Expand Descriptive Terms:** Identify any descriptive terms in the user's prompt that refer to the uploaded image (e.g., 'red dress', 'the person', 'this building', 'the car'). Expand these into cinematic, highly-detailed descriptions.

3. **Inject Cinematic Details:** Rewrite the entire prompt, adding rich visual, lighting, and textural information designed to achieve photorealism and faithful reproduction of the input image's qualities. Use terms like:
   - **Lighting:** Cinematic studio lighting, soft rim light, volumetric dust motes, golden hour, deep shadows, natural daylight, dramatic backlighting
   - **Realism/Aesthetics:** Ultra-photorealistic, 8k resolution, captured on Hasselblad, 70mm film grain, hyper-detailed, life-like, professional photography
   - **Texture:** Intricate fabric weave, sub-surface scattering on skin, metallic sheen, true-to-life texture mapping, fine details

4. **Preserve Original Context:** Always instruct the generation model to preserve the exact likeness, pose, facial features, body composition, and environmental context of the original uploaded image while seamlessly integrating the user's specific modification.

**Output Format:** Provide a single, fully expanded, enhanced prompt. Start with explicit instructions to preserve the original image's qualities, then describe the modification with cinematic detail.

**Example Structure:**
"Ultra-photorealistic 8k photograph. Preserve the exact person from the uploaded image including their facial structure, skin tone, body composition, and pose. [User's modification described with cinematic detail]. Maintain hyper-detailed texture mapping, realistic lighting with [lighting description], and the original image's background, setting, and perspective. Captured on Hasselblad with natural film grain."

CRITICAL: Your enhanced prompt must always emphasize preserving the original image's likeness and only modifying what the user explicitly requests.`;

export async function POST({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    const userPrompt = formData.get('prompt') as string | null;

    // Collect all uploaded images
    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        imageFiles.push(value);
      }
    }

    if (imageFiles.length === 0 || !userPrompt) {
      return new Response(JSON.stringify({ error: 'Missing images or prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Step 1: Enhancing prompt with GPT-Turbo...');
    
    // Step 1: Enhance the user's prompt using GPT-Turbo
    const turboResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: TURBO_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `User's base prompt: "${userPrompt}"
          
Please enhance this prompt for photorealistic image generation, adding cinematic details while preserving the original image's exact likeness and characteristics.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const enhancedPrompt = turboResponse.choices[0].message.content?.trim();
    
    if (!enhancedPrompt) {
      throw new Error('Failed to generate enhanced prompt');
    }

    console.log('Enhanced prompt:', enhancedPrompt);
    console.log('Step 2: Generating image with gpt-image-1 and enhanced prompt...');
    
    // Step 2: Generate image using OpenAI's image edit endpoint with enhanced prompt
    // Note: The system prompt is applied through the API's behavior, not as a message parameter
    const imageResult = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFiles[0], // Use first image as base
      prompt: `${GPT1_SYSTEM_PROMPT}

${enhancedPrompt}`,
      n: 1
    });

    if (!imageResult.data || imageResult.data.length === 0) {
      throw new Error('No images returned from gpt-image-1');
    }

    // Get the generated image URL
    const generatedImage = imageResult.data[0];
    const imageUrl = generatedImage.url || 
      (generatedImage.b64_json ? `data:image/png;base64,${generatedImage.b64_json}` : null);

    if (!imageUrl) {
      throw new Error('No usable image returned from OpenAI');
    }

    console.log('Image generated successfully');

    // Return the generated image along with both prompts for reference
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        originalPrompt: userPrompt,
        enhancedPrompt: enhancedPrompt
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error('ImageEdit error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}