<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { workflowContext } from '$lib/stores/workflow.store';

	let imageUrl = '';
	let loading = false;
	let prompt = '';
	let status = '';

	// Read prompt from URL parameter on mount
	onMount(() => {
		const urlPrompt = $page.url.searchParams.get('prompt');
		const fromCoach = $page.url.searchParams.get('from');

		if (urlPrompt) {
			prompt = urlPrompt;

			// If coming from coach, mark as in-progress
			if (fromCoach === 'coach') {
				workflowContext.startCurrentStep();
				status = '✨ Prompt loaded from coach! Ready to generate.';
			}
		}
	});

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

			// Mark CREATE step as complete in workflow
			workflowContext.completeCurrentStep(imageUrl);

			status =
				'✅ Image created! Next: Upload to Refine (Image Edit) for photorealistic enhancement.';
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
		a.download = `content-factory-${Date.now()}.png`;
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
		<div class="text-center">
			<h2 class="mb-2 text-xl font-bold text-white">Create</h2>
			<p class="text-sm text-white/70">Generate unique, artistic images with DALL-E</p>
		</div>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Prompt</legend>
			<textarea
				bind:value={prompt}
				placeholder="Describe the image you want to generate..."
				class="textarea-bordered textarea w-full resize-y bg-base-100 text-white"
				style="min-height: 120px; max-height: 500px;"
				rows="5"
			></textarea>
			<p class="mt-1 text-xs text-base-content/50">
				💡 More detail = better results. Describe style, mood, colors, composition.
			</p>
		</fieldset>

		<div class="flex flex-col gap-3">
			<button
				on:click={generateImage}
				disabled={loading || !prompt}
				class="btn btn-neutral {loading || !prompt ? 'btn-disabled' : ''}"
			>
				{loading ? 'Generating...' : 'Generate Image'}
			</button>

			{#if status}
				<div
					class="alert {status.includes('Error')
						? 'alert-error'
						: status.includes('✅')
							? 'alert-success'
							: 'alert-info'} py-2"
				>
					<span class="text-sm">{status}</span>
				</div>
			{/if}
		</div>

		<!-- Workflow Navigation Hint -->
		{#if imageUrl && !loading}
			<div class="card border border-neutral bg-neutral/20">
				<div class="card-body p-4">
					<h3 class="flex items-center gap-2 text-sm font-bold">
						<span>🎯</span>
						<span>Next Step: Refine</span>
					</h3>
					<p class="mt-2 text-xs text-base-content/70">
						Download your image, then upload it to <strong>Refine</strong> (Image Edit) in the sidebar
						to add photorealistic perfection while keeping that unique style.
					</p>
					<a href="/imageedit" class="btn mt-3 btn-sm btn-neutral"> Go to Refine → </a>
				</div>
			</div>
		{/if}
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
						<div class="loading loading-lg loading-spinner text-neutral"></div>
						<p class="text-center text-white">Creating your unique image...</p>
					</div>
				</div>
			{:else if imageUrl}
				<img src={imageUrl} alt="Generated" class="h-full w-full rounded-lg object-contain" />
				<button on:click={downloadImage} class="btn absolute top-4 right-4 btn-sm btn-neutral">
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
