<script lang="ts">	
	import Hero from '$lib/components/landing/Hero.svelte';
	//import ChatAI from '$lib/components/Chat.svelte';
	import VideoGenerate from '$lib/components/VideoGenerate/VideoGenerate.svelte';
	let uploadedImage: File | null = null;
	let imagePreview = '';
	let imageUrl = '';
	let loading = false;

	// Overlay customization
	let overlayText = '';
	let overlayFont = 'Arial';
	let textSize = 32;
	let textColor = '#FF0000';
	let textX = 20;
	let textY = 60;
	let selectedEmoji = '✨';
	let overlayLoading = false;
	let prompt = '';
	434;
	let uploadedImages: File[] = [];
	let imagePreviews: string[] = [];
	let imageUrls: string[] = []; // results from backend

	const fonts = ['Arial', 'Georgia', 'Courier New', 'Comic Sans MS', 'Impact', 'Verdana'];
	const emojis = ['✨', '🔥', '⭐', '🎨', '💯', '🚀', '👑', '💎', '🌟', '🎯', '⚡', '💫'];
	const colors = [
		'#FF0000',
		'#00FF00',
		'#0000FF',
		'#FFFF00',
		'#FF00FF',
		'#00FFFF',
		'#FFFFFF',
		'#000000',
		'#FFA500',
		'#800080'
	];

	

	async function generateImage(prompt: string) {
		loading = true;
		try {
			const response = await fetch('/api/video', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt })
			});
			const { imageUrl: generatedUrl, imageBase64 } = await response.json();
			imageUrl = generatedUrl ?? (imageBase64 ? `data:image/png;base64,${imageBase64}` : '');
		} catch (err) {
			console.error('Image generation error:', err);
		} finally {
			loading = false;
		}
	}

	async function applyOverlay() {
		if (!imageUrl) return;
		overlayLoading = true;
		try {
			const response = await fetch('/api/canvas', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					imageUrl,
					text: overlayText || selectedEmoji,
					textX,
					textY,
					textColor,
					textSize,
					font: overlayFont
				})
			});
			const { imageUrl: overlaidUrl, imageBase64 } = await response.json();
			imageUrl = overlaidUrl ?? (imageBase64 ? `data:image/png;base64,${imageBase64}` : '');
		} catch (err) {
			console.error('Overlay error:', err);
		} finally {
			overlayLoading = false;
		}
	}

	function downloadImage() {
		if (!imageUrl) return;
		const a = document.createElement('a');
		a.href = imageUrl;
		a.download = 'generated-image.png';
		document.body.appendChild(a);
		a.click();
		a.remove();
	}

	function addEmojiToText() {
		overlayText += selectedEmoji;
	}

	function handleFileChange(event: Event) {
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
	async function trickOutPhoto(prompt: string) {
		if (uploadedImages.length === 0 || !prompt) return;
		loading = true;

		const formData = new FormData();
		for (const file of uploadedImages) {
			formData.append('images', file);
		}
		formData.append('prompt', prompt);

		try {
			const response = await fetch('/api/ImageEdit', {
				method: 'POST',
				body: formData
			});
			const data = await response.json();

			if (Array.isArray(data.imageUrls)) {
				imageUrls = data.imageUrls; // ✅ assign to reactive let
			} else if (data.imageBase64) {
				imageUrls = [`data:image/png;base64,${data.imageBase64}`];
			} else {
				imageUrls = [];
			}
		} catch (err) {
			console.error('Image edit error:', err);
			imageUrls = [];
		} finally {
			loading = false;
		}
	}
</script>
<Hero />
<main
	class="flex min-h-screen flex-col items-center justify-center space-y-12 bg-black p-6 text-white"
>
	<VideoGenerate />
	<!-- Upload/Edit Section -->
	<!-- Upload/Edit Section -->
	<div class="flex w-full max-w-4xl flex-col items-center space-y-6">
		<input
			type="file"
			accept="image/*"
			multiple
			on:change={handleFileChange}
			class="w-full rounded-lg border border-gray-700 bg-gray-900 p-4 text-lg shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
		/>

		<!-- Preview multiple uploads -->
		{#if imagePreviews.length > 0}
			<div class="flex flex-wrap justify-center gap-4">
				{#each imagePreviews as preview}
					<img
						src={preview}
						alt="Preview"
						class="h-40 w-40 rounded-lg border border-gray-700 object-cover shadow-xl"
					/>
				{/each}
			</div>
		{/if}

		<input
			type="text"
			bind:value={prompt}
			placeholder="How do you want to trick out your photo?"
			class="w-full rounded-lg border border-gray-700 bg-gray-900 p-4 text-xl shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
		/>

		<button
			on:click={() => trickOutPhoto(prompt)}
			disabled={loading}
			class="flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-xl font-semibold shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
		>
			{#if loading}
				<span class="loader mr-2"></span> Processing...
			{:else}
				Trick Out My Photo!
			{/if}
		</button>

		<!-- Display multiple results -->
		{#if imageUrls.length > 0}
			<div class="flex flex-wrap justify-center gap-4">
				{#each imageUrls as url}
					<div class="flex flex-col items-center">
						<img
							src={url}
							alt="Result"
							class="h-40 w-40 rounded-lg border border-gray-700 object-cover shadow-xl"
						/>
						<a
							href={url}
							download="tricked-out.png"
							class="mt-2 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold shadow-lg transition-colors hover:bg-green-700"
						>
							Download
						</a>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	<!----end of the multiple uploads-->
	
	<!-- <ChatAI /> -->
	<!-- Image Generator -->
	<section class="w-full max-w-2xl rounded-lg bg-gray-900 p-6 shadow-lg">
		<h2 class="mb-4 text-2xl font-bold">🎨 Image Generator</h2>
		<input
			bind:value={prompt}
			placeholder="Enter your image prompt..."
			class="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 p-4 text-lg shadow-lg"
		/>
		<button
			on:click={() => generateImage(prompt)}
			disabled={loading}
			class="w-full rounded-lg bg-purple-600 px-6 py-3 text-xl font-semibold shadow-lg transition-colors hover:bg-purple-700 disabled:opacity-50"
		>
			{loading ? 'Generating...' : 'Generate Image'}
		</button>

		{#if imageUrl}
			<div class="mt-6 text-center">
				<img
					src={imageUrl}
					alt="Generated"
					class="mx-auto max-w-lg rounded-lg border border-gray-700 shadow-xl"
				/>
				<button
					on:click={downloadImage}
					class="mt-4 rounded-lg bg-green-600 px-6 py-2 shadow-lg hover:bg-green-700"
				>
					⬇️ Download Image
				</button>
			</div>

			<!-- Canvas Customization -->
			<div class="mt-8 rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-lg">
				<h3 class="mb-4 text-xl font-semibold">✨ Customize Your Image</h3>

				<!-- Overlay Text -->
				<div class="mb-4">
					<h4 class="mb-2 font-medium">Text Overlay</h4>
					<input
						bind:value={overlayText}
						placeholder="Add text to overlay on image..."
						class="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
					/>
				</div>

				<!-- Emoji Picker -->
				<div class="mb-4">
					<h4 class="mb-2 font-medium">Add Emoji</h4>
					<div class="mb-2 flex flex-wrap gap-2">
						{#each emojis as emoji}
							<button
								type="button"
								on:click={() => (selectedEmoji = emoji)}
								class={`rounded-lg px-3 py-2 text-xl shadow-md transition-colors ${
									selectedEmoji === emoji
										? 'bg-blue-600 text-white'
										: 'bg-gray-700 text-white hover:bg-gray-600'
								}`}
							>
								{emoji}
							</button>
						{/each}
					</div>
					<button
						type="button"
						on:click={addEmojiToText}
						class="rounded-lg bg-orange-500 px-4 py-2 text-white shadow-lg hover:bg-orange-600"
					>
						Add Selected Emoji
					</button>
				</div>

				<!-- Font Selector -->
				<div class="mb-4">
					<h4 class="mb-2 font-medium">Font</h4>
					<select
						bind:value={overlayFont}
						class="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
					>
						{#each fonts as font}
							<option value={font}>{font}</option>
						{/each}
					</select>
				</div>

				<!-- Text Size -->
				<div class="mb-4">
					<h4 class="mb-2 font-medium">Text Size: {textSize}px</h4>
					<input
						type="range"
						bind:value={textSize}
						min="12"
						max="120"
						class="w-full accent-green-500"
					/>
				</div>

				<!-- Text Color -->
				<div class="mb-4">
					<h4 class="mb-2 font-medium">Text Color</h4>
					<input
						type="color"
						bind:value={textColor}
						class="h-12 w-full cursor-pointer rounded-lg border border-gray-700"
					/>
				</div>

				<!-- Position Controls -->
				<div class="mb-4">
					<h4 class="mb-2 font-medium">Text Position X: {textX}px</h4>
					<input
						type="range"
						bind:value={textX}
						min="0"
						max="1000"
						class="w-full accent-green-500"
					/>
				</div>
				<div class="mb-4">
					<h4 class="mb-2 font-medium">Text Position Y: {textY}px</h4>
					<input
						type="range"
						bind:value={textY}
						min="0"
						max="1000"
						class="w-full accent-green-500"
					/>
				</div>

				<!-- Apply Overlay -->
				<button
					type="button"
					on:click={applyOverlay}
					disabled={overlayLoading}
					class="flex w-full items-center justify-center rounded-lg bg-green-600 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-green-700"
				>
					{#if overlayLoading}
						<span class="loader mr-2"></span> Applying Overlay...
					{:else}
						🎨 Apply Overlay
					{/if}
				</button>
			</div>
		{/if}
	</section>
</main>

<style>
	/* Spinner animation */
	.loader {
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top: 3px solid #fff;
		border-radius: 50%;
		width: 1rem;
		height: 1rem;
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
