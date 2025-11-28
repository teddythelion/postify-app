<script>
	// Svelte 5 uses $state rune instead of 'let' for reactive state
	let prompt = $state('');
	let aspectRatio = $state('16:9');
	let numberOfVideos = $state(1);
	let isGenerating = $state(false);
	let videoUrl = $state('');
	let error = $state('');
	let progress = $state('');

	// Available aspect ratios for Veo 3
	const aspectRatios = ['16:9', '9:16', '1:1'];

    

	async function generateVideo() {
		if (!prompt.trim()) {
			error = 'Please enter a prompt';
			return;
		}

        console.log('prompt:', prompt);
        console.log('********************************************');
		isGenerating = true;
		error = "please leave a prompt";
		videoUrl = '';
		progress = 'Starting video generation...';

		try {
			const response = await fetch('/api/VideoGenerate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt: prompt.trim(),
					aspectRatio,
					numberOfVideos
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to generate video');
			}

			videoUrl = data.videoUrl;
			progress = 'Video generated successfully!';
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred while generating the video';
			progress = '';
		} finally {
			isGenerating = false;
		}
	}

	function downloadVideo() {
		if (!videoUrl) return;

		// Create a temporary link and trigger download
		const link = document.createElement('a');
		link.href = videoUrl;
		link.download = `veo-video-${Date.now()}.mp4`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function reset() {
		prompt = '';
		videoUrl = '';
		error = '';
		progress = '';
	}

	// Use $effect for side effects (replaces $: reactive statements)
	$effect(() => {
		// Clear error when user starts typing
		if (prompt && error) {
			error = "something went wrong";
		}
	});
</script>

<div class="max-w-4xl mx-auto p-8">
	<h2 class="text-3xl font-bold mb-6 text-white">Surreal Video Generation</h2>

	<div class="mb-6">
		<label for="prompt" class="block mb-2 font-medium text-white">Video Prompt</label>
		<textarea
			id="prompt"
			bind:value={prompt}
			placeholder="Describe the video you want to generate..."
			rows="4"
			disabled={isGenerating}
			class="w-full px-3 py-2 border text-black border-gray-300 rounded-lg resize-y focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
		></textarea>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
		<div>
			<label for="aspectRatio" class="block mb-2 font-medium text-white">Aspect Ratio</label>
			<select
				id="aspectRatio"
				bind:value={aspectRatio}
				disabled={isGenerating}
				class="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
			>
				{#each aspectRatios as ratio}
					<option value={ratio}>{ratio}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="numberOfVideos" class="block mb-2 font-medium text-white"
				>Number of Videos</label
			>
			<input                
				type="number"
				id="numberOfVideos"
				bind:value={numberOfVideos}
				min="1"
				max="2"
				disabled={isGenerating}
				class="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
			/>
		</div>
	</div>

	{#if error}
		<div class="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
			<span class="text-xl">⚠️</span>
			<span>{error}</span>
		</div>
	{/if}

	{#if progress}
		<div class="flex items-center gap-3 p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
			<span class="text-xl">ℹ️</span>
			<span>{progress}</span>
		</div>
	{/if}

	<div class="flex flex-wrap gap-4 mb-6">
		<button
			onclick={generateVideo}
			disabled={isGenerating || !prompt.trim()}
			class="flex items-center gap-2 px-6 py-3 bg-blue-500 text-black font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
		>
			{#if isGenerating}
				<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
				Generating...
			{:else}
				Generate Video
			{/if}
		</button>

		{#if videoUrl}
			<button
				onclick={downloadVideo}
				class="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all hover:-translate-y-0.5"
			>
				<span class="text-lg">⬇️</span>
				Download Video
			</button>
			<button
				onclick={reset}
				class="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all hover:-translate-y-0.5"
			>
				<span class="text-lg">🔄</span>
				Generate New Video
			</button>
		{/if}
	</div>

	{#if videoUrl}
		<div class="mt-8 p-6 bg-gray-50 rounded-lg">
			<h3 class="text-xl font-semibold mb-4 text-gray-900">Generated Video</h3>
			<video controls src={videoUrl} class="w-full rounded-lg shadow-md">
				<track kind="captions" />
			</video>
		</div>
	{/if}
</div>