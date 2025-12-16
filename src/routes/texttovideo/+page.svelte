<script lang="ts">
	import ThreeJsEnhancer from '$lib/components/ThreeJsEnhancer/ThreeJsEnhancer.svelte';
	import VideoEffectsPanel from '$lib/components/VideoEffectsPanel.svelte';

	//update2
	let prompt = '';
	let duration = 8;
	let operation = '';
	let video = '';
	let status = '';
	let isGenerating = false;
	let aspectRatios = '16:9';
	let uploadedImages: File[] = [];
	let imagePreviews: string[] = [];
	let isProcessingImages = false;
	let uploadedVideoForEditing: string = '';
	let isVideoUploaded = false;

	// NEW: Enhancement modals
	let showVideoEnhancer = false;
	let showEffectsPanel = false;
	// Removed: let isProcessingEffects = false; (no longer needed)

	//updated
	async function generate() {
		if (!prompt.trim()) {
			status = 'Error: Prompt is required';
			return;
		}

		isGenerating = true;
		status = 'Generating...';
		video = '';
		console.log('📹 Starting generation');

		try {
			if (uploadedImages.length > 0) {
				await generateFromImage();
			} else {
				await generateFromPrompt();
			}
		} catch (err) {
			console.error('Generation error:', err);
			status = `Error: ${err instanceof Error ? err.message : String(err)}`;
			isGenerating = false;
		}
	}

	async function generateFromPrompt() {
		console.log('📝 Generating from prompt only');
		try {
			const res = await fetch('/api/veo2-simple/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt, duration, aspectRatios })
			});
			const data = await res.json();

			if (data.error) {
				status = `Error: ${data.error}`;
				isGenerating = false;
				return;
			}

			operation = data.operation;
			console.log(`✅ Operation started: ${operation}`);
			status = 'Waiting 30 seconds...';
			setTimeout(poll, 30000);
		} catch (err) {
			console.error('Prompt generation error:', err);
			status = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
			isGenerating = false;
		}
	}

	async function generateFromImage() {
		console.log(`🖼️ Generating with ${uploadedImages.length} image(s)`);
		const formData = new FormData();

		for (const file of uploadedImages) {
			formData.append('images', file);
		}
		formData.append('prompt', prompt);
		formData.append('duration', duration.toString());
		formData.append('aspectRatios', aspectRatios);

		try {
			const res = await fetch('/api/veo2-simple/generateFromImage', {
				method: 'POST',
				body: formData
			});
			const data = await res.json();

			if (data.error) {
				status = `Error: ${data.error}`;
				isGenerating = false;
				return;
			}

			operation = data.operation;
			console.log(`✅ Operation started: ${operation}`);
			status = 'Waiting 30 seconds...';
			setTimeout(poll, 30000);
		} catch (err) {
			console.error('Image generation error:', err);
			status = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
			isGenerating = false;
		}
	}

	async function poll() {
		console.log('🔄 Polling for status...');
		try {
			const res = await fetch('/api/veo2-simple/poll', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ operation })
			});
			const data = await res.json();

			if (data.done) {
				if (data.error) {
					console.error('❌ Generation failed:', data.error);
					status = `Error: ${data.error}`;
					isGenerating = false;
				} else if (data.video) {
					console.log('✅ Video ready!');
					video = data.video;
					status = 'Done! Ready to enhance or download.';
					isGenerating = false;
				} else {
					console.error('❌ No video in response');
					status = 'Error: No video generated';
					isGenerating = false;
				}
			} else if (data.error) {
				console.error('❌ Polling error:', data.error);
				status = `Error: ${data.error}`;
				isGenerating = false;
			} else {
				status = 'Still processing...';
				console.log('⏳ Still processing, polling again in 15s');
				setTimeout(poll, 15000);
			}
		} catch (err) {
			console.error('Polling error:', err);
			status = `Error: ${err instanceof Error ? err.message : 'Polling failed'}`;
			isGenerating = false;
		}
	}

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (files && files.length > 0) {
			uploadedImages = Array.from(files);
			imagePreviews = [];
			isProcessingImages = true;

			let loadedCount = 0;

			for (const file of uploadedImages) {
				const reader = new FileReader();
				reader.onload = (e: ProgressEvent<FileReader>) => {
					if (e.target?.result) {
						imagePreviews = [...imagePreviews, e.target.result as string];
					}
					loadedCount++;

					if (loadedCount === uploadedImages.length) {
						isProcessingImages = false;
					}
				};
				reader.readAsDataURL(file);
			}
		}
	}

	function clearImages() {
		uploadedImages = [];
		imagePreviews = [];
	}

	function removeImage(index: number) {
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
		imagePreviews = imagePreviews.filter((_, i) => i !== index);
	}

	function handleVideoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file && file.type.startsWith('video/')) {
			const reader = new FileReader();
			reader.onload = (e: ProgressEvent<FileReader>) => {
				if (e.target?.result) {
					uploadedVideoForEditing = e.target.result as string;
					video = uploadedVideoForEditing;
					isVideoUploaded = true;
					status = 'Video uploaded! Ready to edit.';
				}
			};
			reader.readAsDataURL(file);
		} else {
			status = 'Error: Please upload a valid video file';
		}
	}

	function clearUploadedVideo() {
		uploadedVideoForEditing = '';
		video = '';
		isVideoUploaded = false;
		status = '';
	}

	// NEW: Enhancement functions
	function openVideoEnhancer() {
		console.log('🎬 Opening enhancer with video:', video); // Add this
		if (video) {
			showVideoEnhancer = true;
		}
	}

	function openEffectsPanel() {
		if (video) {
			showEffectsPanel = true;
		}
	}

	// REMOVED: applyVideoEffects function - no longer needed!
	// The VideoEffectsPanel now handles everything internally

	function downloadVideo() {
		if (!video) return;
		const a = document.createElement('a');
		a.href = video;
		a.download = `video-${Date.now()}.mp4`;
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
</script>

<div class="flex flex-col gap-6 py-4 lg:flex-row xl:pl-12 2xl:pl-20">
	<!-- LEFT SIDE: Input Controls -->
	<div
		class="flex flex-1 flex-col gap-4 sm:w-full md:w-full lg:max-w-4/5 xl:max-w-3/5 2xl:max-w-1/3"
	>
		<p class="text-center text-sm text-white">Videos come in 4, 6, and 8 seconds.</p>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Duration (Video Length)</legend>
			<select bind:value={duration} class="select-bordered select w-full text-white">
				<option disabled selected>Pick a Duration</option>
				<option value={4}>4 seconds</option>
				<option value={6}>6 seconds</option>
				<option value={8}>8 seconds</option>
			</select>
		</fieldset>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Aspect Ratios</legend>
			<p class="mb-2 text-xs text-white opacity-75">16:9 for Monitors • 9:16 for Phones</p>
			<select bind:value={aspectRatios} class="select-bordered select w-full text-white">
				<option disabled selected>Pick an aspect ratio</option>
				<option value={'16:9'}>16:9</option>
				<option value={'9:16'}>9:16</option>
				<option value={'4:3'}>4:3</option>
			</select>
		</fieldset>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Upload Image (Optional)</legend>
			<input
				type="file"
				accept="image/*"
				multiple
				on:change={handleImageUpload}
				class="file-input w-full file-input-info"
			/>
			{#if uploadedImages.length > 0}
				<p class="mt-2 text-sm text-success">
					{uploadedImages.length} image(s) selected
				</p>
			{/if}
		</fieldset>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Prompt</legend>
			<textarea
				bind:value={prompt}
				placeholder={uploadedImages.length > 0
					? 'Describe how to animate the image (e.g., "animate it so it\'s throwing up a thumbs sign")...'
					: 'Describe the video you want to generate...'}
				class="textarea-bordered textarea min-h-[120px] w-full bg-base-100 text-white"
			></textarea>
		</fieldset>

		<div class="flex flex-col gap-3">
			<button
				on:click={generate}
				disabled={isGenerating || !prompt || isVideoUploaded}
				class="btn btn-info {isGenerating || !prompt || isVideoUploaded ? 'btn-disabled' : ''}"
				title={isVideoUploaded ? 'Cannot generate while video is uploaded for editing' : ''}
			>
				{isGenerating ? 'Generating...' : 'Generate Video'}
			</button>

			{#if uploadedImages.length > 0}
				<button on:click={clearImages} class="btn btn-outline btn-sm btn-error">
					Clear Images
				</button>
			{/if}

			<p class="text-center text-sm {status.includes('Error') ? 'text-error' : 'text-info'}">
				{status}
			</p>
		</div>
	</div>

	<!-- RIGHT SIDE: Video Preview and Image Thumbnails -->
	<div
		class="flex flex-1 flex-col gap-4 pt-10 sm:w-full md:w-full lg:w-full lg:pt-15 xl:max-w-2/5 xl:pl-10 2xl:pl-10"
	>
		<!-- Video Display -->
		<div class="relative h-96 w-full overflow-hidden rounded-lg bg-base-300">
			{#if isGenerating}
				<div
					class="animate-blur absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-lg"
				>
					<div class="flex flex-col items-center gap-4">
						<div class="loading loading-lg loading-spinner text-info"></div>
						<p class="text-center text-white">Video generating...</p>
					</div>
				</div>
			{:else if video}
				<video src={video} controls class="h-full w-full rounded-lg object-cover">
					<track kind="captions" src="" label="English" srclang="en" />
				</video>
				<div class="absolute top-4 right-4 flex flex-col gap-2">
					<button on:click={openVideoEnhancer} class="btn btn-sm btn-success">
						🎬 3D Enhance
					</button>
					<button on:click={openEffectsPanel} class="btn btn-sm btn-warning"> ✨ Effects </button>
					{#if isVideoUploaded}
						<button on:click={clearUploadedVideo} class="btn btn-sm btn-error"> 🗑️ Remove </button>
					{/if}
				</div>
			{:else}
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="flex flex-col items-center gap-4">
						<p class="text-center text-white opacity-50">Video will appear here</p>

						<!-- Upload Video Button -->
						<div class="tooltip" data-tip="Upload video for editing (no generation)">
							<label class="btn cursor-pointer btn-outline btn-sm btn-info">
								📤 Upload Video to Edit
								<input type="file" accept="video/*" on:change={handleVideoUpload} class="hidden" />
							</label>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Image Previews -->
		{#if imagePreviews.length > 0}
			<div class="rounded-lg bg-base-300 p-4">
				<p class="mb-3 text-sm font-semibold text-white">Selected Images:</p>
				<div class="flex flex-wrap gap-3">
					{#each imagePreviews as preview, index}
						<div class="group relative h-24 w-24 overflow-hidden rounded-lg border-2 border-info">
							<img src={preview} alt="preview" class="h-full w-full object-cover" />
							<button
								on:click={() => removeImage(index)}
								class="btn absolute top-1 right-1 btn-circle opacity-0 transition-opacity btn-xs btn-error group-hover:opacity-100"
								aria-label="Remove image"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
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
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- NEW: Video Enhancer Modal -->
{#if showVideoEnhancer && video}
	<ThreeJsEnhancer
		videoUrl={video}
		onClose={() => {
			showVideoEnhancer = false;
		}}
	/>
{/if}

<!-- NEW: Video Effects Panel Modal - UPDATED WITHOUT onApplyEffects -->
{#if showEffectsPanel && video}
	<VideoEffectsPanel
		videoUrl={video}
		onClose={() => {
			showEffectsPanel = false;
		}}
	/>
{/if}
