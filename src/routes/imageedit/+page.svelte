<script lang="ts">
	import ImageUploader from '$lib/components/ImageUploader.svelte';
	import ThreeJSEnhancer from '$lib/components/ThreeJSEnhancer.svelte';

	let imageUrl = '';
	let loading = false;
	let prompt = '';
	let status = '';
	let uploadedImages: File[] = [];
	let imagePreviews: string[] = [];
	let showEnhancer = false;
	let enhancedPrompt = '';
	let refinePrompt = '';
	let isRefining = false;

	async function generateImage() {
		loading = true;
		status = 'Generating image...';

		try {
			const formData = new FormData();
			formData.append('prompt', prompt);

			// Add all uploaded images to FormData
			for (const file of uploadedImages) {
				formData.append('images', file);
			}

			const response = await fetch('/api/imageEdit', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (data.error) {
				status = `Error: ${data.error}`;
				return;
			}

			imageUrl = data.imageUrl;
			enhancedPrompt = data.enhancedPrompt || '';
			status = 'Done!';
		} catch (err) {
			console.error('Image generation error:', err);
			status = `Error: ${err}`;
		} finally {
			loading = false;
		}
	}

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (files && files.length > 0) {
			uploadedImages = Array.from(files);
			imagePreviews = [];

			for (const file of uploadedImages) {
				const reader = new FileReader();
				reader.onload = (e: ProgressEvent<FileReader>) => {
					imagePreviews = [...imagePreviews, e.target?.result as string];
				};
				reader.readAsDataURL(file);
			}
		}
	}

	function clearImages() {
		uploadedImages = [];
		imagePreviews = [];
		imageUrl = '';
		refinePrompt = '';
	}
	function removeImage(index: number) {
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
		imagePreviews = imagePreviews.filter((_, i) => i !== index);

		// If no images left, clear everything
		if (uploadedImages.length === 0) {
			imageUrl = '';
			refinePrompt = '';
		}
	}

	async function refineImage() {
		if (!imageUrl || !refinePrompt) return;

		isRefining = true;
		status = 'Refining image...';

		try {
			// Fetch the current image and convert to File
			const response = await fetch(imageUrl);
			const blob = await response.blob();
			const file = new File([blob], 'current-image.png', { type: 'image/png' });

			const formData = new FormData();
			formData.append('prompt', refinePrompt);
			formData.append('images', file);

			const apiResponse = await fetch('/api/imageEdit', {
				method: 'POST',
				body: formData
			});

			const data = await apiResponse.json();

			if (data.error) {
				status = `Error: ${data.error}`;
				return;
			}

			imageUrl = data.imageUrl;
			enhancedPrompt = data.enhancedPrompt || '';
			status = 'Refinement complete!';
			refinePrompt = ''; // Clear the refine prompt after use
		} catch (err) {
			console.error('Image refinement error:', err);
			status = `Error: ${err}`;
		} finally {
			isRefining = false;
		}
	}

	function openEnhancer() {
		if (imageUrl) {
			showEnhancer = true;
		}
	}

	function downloadImage() {
		if (!imageUrl) return;
		const a = document.createElement('a');
		a.href = imageUrl;
		a.download = `generated-image-${Date.now()}.png`;
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
		<p class="text-center text-sm text-white">
			Upload an image and describe how you want to modify it.
		</p>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Upload Image</legend>
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
				placeholder="Describe how you want to modify the image (e.g., 'Put this person in a Superman outfit lifting off into flight')..."
				class="textarea-bordered textarea min-h-[120px] w-full bg-base-100 text-white"
			></textarea>
		</fieldset>

		<div class="flex flex-col gap-3">
			<button
				on:click={generateImage}
				disabled={loading || !prompt || uploadedImages.length === 0}
				class="btn btn-info {loading || !prompt || uploadedImages.length === 0
					? 'btn-disabled'
					: ''}"
			>
				{loading ? 'Generating...' : 'Generate Image'}
			</button>

			<p class="text-center text-sm {status.includes('Error') ? 'text-error' : 'text-info'}">
				{status}
			</p>
			<div>
				<ImageUploader />
			</div>
		</div>

		<!-- Enhanced Prompt Display (for debugging) -->
		{#if enhancedPrompt}
			<div class="collapse-arrow collapse bg-base-300">
				<input type="checkbox" />
				<div class="collapse-title text-sm font-medium">View Enhanced Prompt</div>
				<div class="collapse-content">
					<p class="text-xs text-base-content/70">{enhancedPrompt}</p>
				</div>
			</div>
		{/if}

		<!-- Refine Image Section (only shows after image is generated) -->
		{#if imageUrl && !loading}
			<div class="divider">OR</div>

			<fieldset class="fieldset">
				<legend class="fieldset-legend">Refine Generated Image</legend>
				<textarea
					bind:value={refinePrompt}
					placeholder="Describe additional changes (e.g., 'Make the logo brighter', 'Add more red color', 'Adjust the background')..."
					class="textarea-bordered textarea min-h-[100px] w-full bg-base-100 text-white"
				></textarea>
			</fieldset>

			<button
				on:click={refineImage}
				disabled={isRefining || !refinePrompt}
				class="btn btn-warning {isRefining || !refinePrompt ? 'btn-disabled' : ''}"
			>
				{isRefining ? 'Refining...' : 'Refine Image'}
			</button>

			<div class="alert alert-warning shadow-lg">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<span class="text-xs">Refining will use the current generated image as the base.</span>
			</div>
		{/if}
	</div>

	<!-- RIGHT SIDE: Image Preview -->
	<div
		class="flex flex-1 flex-col gap-4 pt-10 sm:w-full md:w-full lg:w-full lg:pt-15 xl:max-w-2/5 xl:pl-10 2xl:pl-10"
	>
		<!-- Uploaded Image Previews -->
		{#if imagePreviews.length > 0}
			<div class="rounded-lg bg-base-300 p-4">
				<p class="mb-3 text-sm font-semibold text-white">Uploaded Images:</p>
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

		<!-- Generated Image Display -->
		<div class="relative h-96 w-full overflow-hidden rounded-lg bg-base-300">
			{#if loading}
				<div
					class="animate-blur absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-lg"
				>
					<div class="flex flex-col items-center gap-4">
						<div class="loading loading-lg loading-spinner text-info"></div>
						<p class="text-center text-white">Image generating...</p>
					</div>
				</div>
			{:else if imageUrl}
				<img src={imageUrl} alt="Generated" class="h-full w-full rounded-lg object-contain" />
				<div class="absolute top-4 right-4 flex gap-2">
					<button on:click={downloadImage} class="btn btn-sm btn-info"> Download </button>
					<button on:click={openEnhancer} class="btn btn-sm btn-success">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
							/>
						</svg>
						3D Enhance
					</button>
				</div>
			{:else}
				<div class="absolute inset-0 flex items-center justify-center">
					<p class="text-center text-white opacity-50">Generated image will appear here</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Three.js Enhancer Modal -->
{#if showEnhancer && imageUrl}
	<ThreeJSEnhancer {imageUrl} onClose={() => (showEnhancer = false)} />
{/if}
