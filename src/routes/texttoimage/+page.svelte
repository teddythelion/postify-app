<script lang="ts">
	let imageUrl = '';
	let loading = false;
	let prompt = '';
	let status = '';

	async function generateImage() {
		loading = true;
		status = 'Generating image...';

		try {
			const response = await fetch('/api/imageGen', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt })
			});
			const { imageUrl: generatedUrl, imageBase64 } = await response.json();
			imageUrl = generatedUrl ?? (imageBase64 ? `data:image/png;base64,${imageBase64}` : '');
			status = 'Download your image and upload it to our image editing tool in side nav.';
		} catch (err) {
			console.error('Image generation error:', err);
			status = `Error: ${err}`;
		} finally {
			loading = false;
		}
	}

	function downloadImage() {
		if (!imageUrl) return;
		const a = document.createElement('a');
		a.href = imageUrl;
		a.download = `image-${Date.now()}.png`;
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
			Generate high-quality images from text descriptions.
		</p>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Prompt</legend>
			<textarea
				bind:value={prompt}
				placeholder="Describe the image you want to generate..."
				class="textarea-bordered textarea min-h-[120px] w-full bg-base-100 text-white"
			></textarea>
		</fieldset>

		<div class="flex flex-col gap-3">
			<button
				on:click={generateImage}
				disabled={loading || !prompt}
				class="btn btn-info {loading || !prompt ? 'btn-disabled' : ''}"
			>
				{loading ? 'Generating...' : 'Generate Image'}
			</button>

			<p class="text-center text-sm {status.includes('Error') ? 'text-error' : 'text-info'}">
				{status}
			</p>
		</div>
	</div>

	<!-- RIGHT SIDE: Image Preview -->
	<div
		class="flex flex-1 flex-col gap-4 pt-10 sm:w-full md:w-full lg:w-full lg:pt-15 xl:max-w-2/5 xl:pl-10 2xl:pl-10"
	>
		<!-- Image Display -->
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
				<button on:click={downloadImage} class="btn absolute top-4 right-4 btn-sm btn-info">
					Download
				</button>
			{:else}
				<div class="absolute inset-0 flex items-center justify-center">
					<p class="text-center text-white opacity-50">Image will appear here</p>
				</div>
			{/if}
		</div>
	</div>
</div>
