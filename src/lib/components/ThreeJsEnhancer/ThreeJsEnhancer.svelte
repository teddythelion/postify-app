<!-- src/lib/components/ThreeJsEnhancer.svelte -->
<!-- MAIN ORCHESTRATOR COMPONENT -->
<!-- Coordinates between stores, scene, and controls -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { videoState } from '$lib/stores/video.store';
	import { threeJsState } from '$lib/stores/threeJs.store';
	import ThreeJsScene from './ThreeJsScene.svelte';
	import ControlsPanel from './ControlsPanel.svelte';

	export let videoUrl: string;
	export let onClose: () => void;
	console.log('🚀 ThreeJsEnhancer RECEIVED PROP videoUrl:', videoUrl);
	console.log('🚀 videoUrl length:', videoUrl?.length);
	console.log('🚀 videoUrl starts with:', videoUrl?.substring(0, 50));
	$: console.log('📦 Store state:', $videoState);

	if (videoUrl) {
		console.log('✅ Setting video in store NOW...');
		videoState.setVideo(videoUrl);
		console.log('✅ Done! Check store:', videoState);
	}

	$: if (videoUrl) {
		console.log('🔵 ThreeJsEnhancer received videoUrl:', videoUrl);
		videoState.setVideo(videoUrl);
		console.log('✅ Called setVideo');
		console.log('📦 Store after setVideo:', $videoState.videoUrl);
	} else {
		videoState.setError('No video URL provided');
	}
	// Subscribe to stores

	$: isVideoLoaded = $videoState.isVideoLoaded;
	$: videoError = $videoState.videoError;
	$: processedVideoUrl = $videoState.threeDVideoUrl;
	$: isCapturing = $threeJsState.isCapturing;

	function downloadProcessedVideo() {
		if (!processedVideoUrl) return;
		const a = document.createElement('a');
		a.href = processedVideoUrl;
		a.download = `3d-video-${Date.now()}.webm`;
		document.body.appendChild(a);
		a.click();
		a.remove();
	}

	function base64ToBlob(base64: string, mimeType: string): Blob {
		const byteCharacters = atob(base64);
		const byteArrays = [];
		for (let offset = 0; offset < byteCharacters.length; offset += 512) {
			const slice = byteCharacters.slice(offset, offset + 512);
			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}
		return new Blob(byteArrays, { type: mimeType });
	}
</script>

<!-- LAYOUT: Same as VideoEffectsPanel -->
<div class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/90 p-4">
	<div class="flex h-full w-full max-w-7xl flex-col gap-4 overflow-hidden lg:flex-row">
		<!-- Preview Section (Left) -->
		<div class="flex flex-1 flex-col gap-4 overflow-y-auto">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-white">Video Editor</h2>
				<button
					on:click={onClose}
					class="btn btn-circle btn-ghost btn-sm"
					aria-label="Close enhancer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Three.js Scene Component -->

			<div
				class="relative flex-1 overflow-hidden rounded-lg bg-base-300"
				style="min-height: 0; aspect-ratio: 16/9;"
			>
				{#if videoError}
					<div
						class="absolute inset-0 flex items-center justify-center bg-red-900/50 backdrop-blur-lg"
					>
						<div class="flex flex-col items-center gap-4 text-center">
							<p class="text-red-300">{videoError}</p>
						</div>
					</div>
				{:else if !isVideoLoaded}
					<div
						class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-lg"
					>
						<div class="flex flex-col items-center gap-4">
							<div class="loading loading-lg loading-spinner text-info"></div>
							<p class="text-center text-white">Loading 3D scene...</p>
						</div>
					</div>
				{/if}
				<div class="relative h-full w-full">
					<!-- Scene passes videoUrl from store -->
					<ThreeJsScene />
				</div>
			</div>

			<!-- Download Button -->
			<!-- In your template, update the download button section: -->
			{#if processedVideoUrl}
				<div class="rounded-lg border border-green-500/50 bg-green-900/30 p-4">
					<p class="mb-2 text-sm text-green-400">✅ Video captured successfully!</p>
					<button
						on:click={downloadProcessedVideo}
						class="btn w-full btn-sm btn-success"
						disabled={isCapturing}
					>
						⬇️ Download 3D Video
					</button>
				</div>
			{:else if isCapturing}
				<div class="rounded-lg border border-blue-500/50 bg-blue-900/30 p-4">
					<p class="mb-2 text-sm text-blue-400">🎬 Capturing video...</p>
				</div>
			{/if}
		</div>

		<!-- Controls Panel (Right) -->
		<ControlsPanel />
	</div>
</div>

<style>
	::-webkit-scrollbar {
		width: 8px;
	}

	::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
