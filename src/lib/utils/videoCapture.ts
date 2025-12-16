// src/lib/utils/videoCapture-mediarecorder.ts
// WORKING SOLUTION: Use MediaRecorder with requestAnimationFrame for smooth capture

import { get } from 'svelte/store';
import { videoState } from '$lib/stores/video.store';

/**
 * Captures the Three.js canvas with proper video encoding using MediaRecorder
 */
export async function captureThreeJsVideo(progressCallback?: (progress: number, message: string) => void): Promise<void> {
	const $videoState = get(videoState);

	if (!$videoState.videoUrl || !$videoState.isVideoLoaded) {
		throw new Error('Video not loaded');
	}

	const canvas = (window as any).__threeJsCanvas as HTMLCanvasElement | undefined;
	if (!canvas) {
		throw new Error('Failed to get canvas - ThreeJsScene not mounted');
	}

	const videoElement = (window as any).__threeJsVideo as HTMLVideoElement | undefined;
	if (!videoElement) {
		throw new Error('Video element not found');
	}

	const videoDuration = videoElement.duration;
	const fps = 30;

	console.log(`📹 Starting capture: ${videoDuration.toFixed(2)}s at ${fps} FPS`);
	progressCallback?.(0, `Starting capture...`);

	try {
		// Reset video to start
		videoElement.currentTime = 0;
		await new Promise((resolve) => {
			videoElement.addEventListener('seeked', resolve, { once: true });
		});

		// Check MediaRecorder support
		const mimeTypes = [
			'video/webm;codecs=vp9',
			'video/webm;codecs=vp8',
			'video/webm'
		];

		let selectedMimeType = '';
		for (const mimeType of mimeTypes) {
			if (MediaRecorder.isTypeSupported(mimeType)) {
				selectedMimeType = mimeType;
				console.log('✅ Using codec:', mimeType);
				break;
			}
		}

		if (!selectedMimeType) {
			throw new Error('No supported video codec found. Try Chrome or Firefox.');
		}

		progressCallback?.(5, 'Setting up recorder...');

		// Create stream from canvas
		const stream = canvas.captureStream(fps);
		
		if (stream.getVideoTracks().length === 0) {
			throw new Error('Failed to capture canvas stream');
		}

		// Create MediaRecorder
		const mediaRecorder = new MediaRecorder(stream, {
			mimeType: selectedMimeType,
			videoBitsPerSecond: 8_000_000 // ✅ Increased from 5 to 8 Mbps for better quality
		});

		const chunks: Blob[] = [];

		// Collect chunks
		mediaRecorder.ondataavailable = (event) => {
			if (event.data && event.data.size > 0) {
				chunks.push(event.data);
				console.log(`📦 Chunk ${chunks.length}: ${(event.data.size / 1024).toFixed(2)}KB`);
			}
		};

		// Start recording
		mediaRecorder.start(50); // ✅ Collect data every 50ms for smoother capture
		console.log('🎬 Recording started');
		progressCallback?.(10, 'Recording in progress...');

		// Play through the video with proper frame timing
		const startTime = performance.now();
		let lastUpdate = 0;
		let frameCount = 0;

		// Use setInterval to smoothly play through the video
		await new Promise<void>((resolve, reject) => {
			const interval = setInterval(async () => {
				const elapsed = performance.now() - startTime;
				const targetTime = Math.min(elapsed / 1000, videoDuration);
				
				videoElement.currentTime = targetTime;

				// ✅ Give encoder a tiny break every 30 frames to prevent dropping
				if (frameCount++ % 30 === 0 && frameCount > 1) {
					await new Promise(r => setTimeout(r, 10));
				}

				// Update progress every 500ms
				if (elapsed - lastUpdate > 500) {
					const progress = 10 + (targetTime / videoDuration) * 70;
					progressCallback?.(progress, `Recording: ${targetTime.toFixed(1)}/${videoDuration.toFixed(1)}s`);
					lastUpdate = elapsed;
				}

				// Check if we're done
				if (targetTime >= videoDuration) {
					clearInterval(interval);
					
					// Wait a bit for final frames to be captured
					setTimeout(() => {
						mediaRecorder.stop();
						progressCallback?.(80, 'Finalizing video...');
					}, 500);
				}
			}, 1000 / fps); // Update at target FPS

			// Handle recording stop
			mediaRecorder.onstop = () => {
				stream.getTracks().forEach(track => track.stop());
				resolve();
			};

			mediaRecorder.onerror = () => {
				clearInterval(interval);
				reject(new Error('MediaRecorder error'));
			};

			// Safety timeout
			setTimeout(() => {
				if (mediaRecorder.state !== 'inactive') {
					clearInterval(interval);
					mediaRecorder.stop();
					reject(new Error('Recording timeout'));
				}
			}, (videoDuration + 5) * 1000);
		});

		console.log(`✅ Recorded ${chunks.length} chunks`);
		progressCallback?.(90, 'Preparing download...');

		// Create final video blob
		const videoBlob = new Blob(chunks, { type: selectedMimeType });
		
		console.log(`📊 Final video size: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);

		// Trigger download
		const url = URL.createObjectURL(videoBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `threejs-video-${Date.now()}.webm`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		
		setTimeout(() => URL.revokeObjectURL(url), 1000);

		progressCallback?.(100, 'Download started!');
		console.log('✅ Video download complete');

	} catch (error) {
		console.error('❌ Capture failed:', error);
		throw error;
	}
}