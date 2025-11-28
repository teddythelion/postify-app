<script lang="ts">
	let prompt = '';
	let duration = 5;
	let operation = '';
	let video = '';
	let status = '';
	let isGenerating = false;
	let aspectRatios = '16:9';

	async function generate() {
		isGenerating = true;
		status = 'Generating...';
		console.log('in generation');
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
		status = 'Waiting 30 seconds...';
		setTimeout(poll, 30000);
	}

	async function poll() {
		status = 'Checking...';
		const res = await fetch('/api/veo2-simple/poll', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ operation })
		});
		const data = await res.json();

		if (data.done) {
			video = data.video;
			status = 'Done!';
			isGenerating = false;
		} else {
			status = 'Still processing...';
			setTimeout(poll, 15000);
		}
	}

	export let modalRef2: HTMLDialogElement | undefined;

	async function downloadVideo() {
		if (!video) return;

		try {
			const res = await fetch(video);
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `video-${Date.now()}.mp4`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			console.error('Download failed:', err);
		}
	}
</script>

<button hidden on:click={downloadVideo} class="btn absolute top-4 right-4 btn-sm btn-info">
	Download
</button>
<dialog bind:this={modalRef2} class="modal">
	<div class="modal-box w-11/12 max-w-6xl">
		<!-- Main container: inputs left, video right -->
		<div class="flex flex-col gap-6 py-4 lg:flex-row">
			<!-- LEFT SIDE: Input Controls -->
			<div class="flex flex-1 flex-col gap-4">
				<p class="text-center text-sm text-white">Videos come in 5, 6, 7, and 8 seconds</p>

				<fieldset class="fieldset">
					<legend class="fieldset-legend">Duration (Video Length)</legend>
					<select bind:value={duration} class="select-bordered select w-full text-white">
						<option disabled selected>Pick a Duration</option>
						<option value={5}>5 seconds</option>
						<option value={6}>6 seconds</option>
						<option value={8}>8 seconds</option>
					</select>
				</fieldset>
				<fieldset class="fieldset">
					<legend class="fieldset-legend">Aspect ratios 16:9 for Monitors 9:16 for phones</legend>
					<select bind:value={aspectRatios} class="select-bordered select w-full text-white">
						<option disabled selected>Pick an aspect ratio</option>
						<option value={'16:9'}>16:9</option>
						<option value={'9:16'}>9:16</option>
						<option value={'4:3'}>4:3</option>
					</select>
				</fieldset>

				<fieldset class="fieldset">
					<legend class="fieldset-legend">Prompt</legend>
					<textarea
						bind:value={prompt}
						placeholder="Describe the video you want to generate..."
						class="textarea-bordered textarea min-h-[120px] w-full bg-base-100 text-white"
					></textarea>
				</fieldset>

				<button
					on:click={generate}
					disabled={isGenerating}
					class="btn btn-wide btn-info {isGenerating ? 'btn-disabled' : ''}"
				>
					{isGenerating ? 'Generating...' : 'Generate'}
				</button>

				<p class="text-center text-sm {status.includes('Error') ? 'text-error' : 'text-info'}">
					{status}
				</p>
			</div>

			<!-- RIGHT SIDE: Video Preview (500x500) -->
			<div
				class="min-h-500px lg:min-h-300px md:min-h-270px flex flex-1 items-center justify-center"
			>
				<div class="relative h-96 w-96 overflow-hidden rounded-lg bg-base-300">
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
						<!-- Video display -->
						<video src={video} controls class="h-full w-full rounded-lg object-cover">
							<track kind="captions" src="" label="English" srclang="en" />
						</video>
						<a href={video} download class="btn absolute top-4 right-4 btn-sm btn-info">
							Download
						</a>
					{:else}
						<!-- Empty state -->
						<div class="absolute inset-0 flex items-center justify-center">
							<p class="text-center text-white opacity-50">Video will appear here</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Close Button -->
		<div class="mt-6 flex justify-end">
			<button class="btn btn-outline btn-info" on:click={() => modalRef2?.close()}> Close </button>
		</div>
	</div>
</dialog>

<style>
	@keyframes blur-animation {
		0%,
		100% {
			filter: blur(8px);
		}
		50% {
			filter: blur(12px);
		}
	}

	.animate-blur {
		animation: blur-animation 3s ease-in-out infinite;
	}
</style>
