<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';

	import myImage from '$lib/assets/my-image.png';
	import hisImage from '$lib/assets/his-image.png';
	export let modalRef2: HTMLDialogElement | undefined;
	let inputUser = '';
	let uBubble = '';
	const chat = new Chat({});
	let input = '';
	const { messages } = chat;

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		inputUser = input;
		console.log('inputUser:', inputUser);

		if (!input.trim()) return;
		chat.sendMessage({ text: input }).catch((err) => console.error('Chat error:', err));
		input = '';
		console.log('messages after send:', messages);
	}
</script>

<dialog bind:this={modalRef2} class="modal">
	<div class="modal-box w-11/12 max-w-5xl">
		<!-- Changed to flex-col on mobile, flex-row on large screens -->

		<!-- Textarea and button stack on mobile, side-by-side on large screens -->
		<div class="modal-action mt-10 flex w-full flex-col items-center gap-2 px-4">
			<!-- Chat bubbles area -->
			<div class=" chat grid grid-flow-row-dense grid-cols-3 grid-rows-3"></div>
			<div class="flex w-full flex-col items-center gap-2 px-4">
				<p class="text-center">the videos come in 5, 6, 7, and 8 seconds</p>
				<div class="flex w-full flex-col items-stretch gap-4 lg:max-w-2xl lg:flex-row">
					<form on:submit|preventDefault={handleSubmit} method="dialog" class="px w-full lg:w-428">
						<textarea
							bind:value={input}
							placeholder="suprise us..."
							class="textarea min-h-[50px] w-full bg-base-100 textarea-info lg:flex-1"
						></textarea>

						<button
							type="submit"
							class="btn mt-6 btn-wide btn-outline btn-xs btn-info sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl"
						>
							Gnerate
						</button>
					</form>
				</div>
			</div>
		</div>
		<div class="flex justify-between">
			<button class="btn order-1 btn-outline btn-info" on:click={() => modalRef2?.close()}>
				Close
			</button>
		</div>
	</div>
</dialog>
