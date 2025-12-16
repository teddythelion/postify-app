import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { RequestHandler } from './$types';
//update1
const ffmpeg = new FFmpeg();

interface VideoEffects {
	brightness: number;
	contrast: number;
	saturation: number;
	hue: number;
	blur: number;
	pixelate: number;
	grayscale: number;
	sepia: number;
	invert: number;
	opacity: number;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const videoFile = formData.get('video') as File;
		const effectsJson = formData.get('effects') as string;

		if (!videoFile || !effectsJson) {
			return new Response(
				JSON.stringify({
					error: 'Video file and effects are required'
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const effects: VideoEffects = JSON.parse(effectsJson);

		console.log('🎬 Processing video with effects:', effects);

		// Initialize FFmpeg if not already initialized
		if (!ffmpeg.loaded) {
			console.log('📦 Loading FFmpeg...');
			await ffmpeg.load();
		}

		// Convert File to Uint8Array
		const videoBuffer = await videoFile.arrayBuffer();
		const videoData = new Uint8Array(videoBuffer);

		// Write input file to FFmpeg filesystem
		await ffmpeg.writeFile('input.mp4', videoData);
		console.log('✅ Video loaded into FFmpeg');

		// Build FFmpeg filter string
		const filters = buildFilterString(effects);
		console.log('🔧 Filter string:', filters);

		// Run FFmpeg command - preserve audio
		await ffmpeg.exec([
			'-i',
			'input.mp4',
			'-vf',
			filters,
			'-c:a',
			'aac',
			'-b:a',
			'128k',
			'-c:v',
			'libx264',
			'-preset',
			'fast',
			'-y',
			'output.mp4'
		]);

		console.log('✅ FFmpeg processing complete');

		// Read output file and convert to base64
		const outputData = await ffmpeg.readFile('output.mp4');
		const outputBase64 = Buffer.from(outputData).toString('base64');

		console.log('✅ Video processed successfully');

		// Clean up FFmpeg filesystem
		await ffmpeg.deleteFile('input.mp4');
		await ffmpeg.deleteFile('output.mp4');

		return new Response(
			JSON.stringify({
				success: true,
				videoBase64: outputBase64,
				size: outputData.length
			}),
			{ headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('❌ Video processing error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to process video',
				details: error instanceof Error ? error.message : String(error)
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

function buildFilterString(effects: VideoEffects): string {
	const filters: string[] = [];

	// Brightness and contrast
	const brightness = (effects.brightness - 100) / 100;
	const contrast = effects.contrast / 100;
	if (brightness !== 0 || contrast !== 1) {
		filters.push(`eq=brightness=${brightness}:contrast=${contrast}`);
	}

	// Saturation
	if (effects.saturation !== 100) {
		const sat = effects.saturation / 100;
		filters.push(`saturate=${sat}`);
	}

	// Hue rotation
	if (effects.hue !== 0) {
		filters.push(`hue=h=${effects.hue}`);
	}

	// Grayscale
	if (effects.grayscale > 0) {
		const gray = effects.grayscale / 100;
		filters.push(`colorchannelmixer=0.3*${1 - gray}+0.2*${gray}:0.59*${1 - gray}+0.3*${gray}:0.11*${1 - gray}+0.3*${gray}`);
	}

	// Sepia
	if (effects.sepia > 0) {
		const sepia = effects.sepia / 100;
		filters.push(`colorchannelmixer=${0.393 + 0.607 * (1 - sepia)}:${0.769 - 0.769 * (1 - sepia)}:${0.189 - 0.189 * (1 - sepia)}:${0.349 - 0.349 * (1 - sepia)}:${0.686 + 0.314 * (1 - sepia)}:${0.168 - 0.168 * (1 - sepia)}:${0.272 - 0.272 * (1 - sepia)}:${0.534 - 0.534 * (1 - sepia)}:${0.131 + 0.869 * (1 - sepia)}`);
	}

	// Invert
	if (effects.invert > 0) {
		const inv = effects.invert / 100;
		filters.push(`negate=negate=${inv}`);
	}

	// Blur
	if (effects.blur > 0) {
		filters.push(`boxblur=${effects.blur / 10}`);
	}

	// Pixelate
	if (effects.pixelate > 0) {
		filters.push(`pixelate=block_size=${Math.ceil(effects.pixelate / 5)}`);
	}

	// Opacity/transparency
	if (effects.opacity !== 100) {
		const opacityValue = effects.opacity / 100;
		filters.push(`format=yuva420p,colorchannelmixer=a=${opacityValue}`);
	}

	// Join all filters with comma
	return filters.length > 0 ? filters.join(',') : 'copy';
}