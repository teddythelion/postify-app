<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import MyModalTextToVideo from './ModalTextToVideo.svelte';
	import myImage from '$lib/assets/my-image.png';
	import hisImage from '$lib/assets/his-image.png';
	export let modalRef: HTMLDialogElement | undefined;
	let my_modal2: HTMLDialogElement | undefined;
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

<dialog bind:this={modalRef} class="modal">
	<div class="modal-box w-11/12 max-w-5xl">
		<h3 class="text-lg font-bold">Content Factory</h3>

		<!-- Changed to flex-col on mobile, flex-row on large screens -->
		<div class="flex flex-col gap-4 py-4 pb-20 lg:flex-row lg:gap-0">
			<!-- Removed mr-10, added w-full on mobile -->
			<div class="card w-full bg-info text-primary-content lg:mr-10 lg:w-96">
				<MyModalTextToVideo bind:modalRef2={my_modal2} />
				<!-- for image creation event -->
				<div class="card-body">
					<h2 class="card-title">Text To Video</h2>
					<p>
						Use a prompt to explain what you want adding camera angle specifications lighting and
						mood to get better results.
					</p>
					<div class="card-actions justify-end">
						<button class="btn" on:click={() => my_modal2?.showModal()}>Start Here</button>
					</div>
				</div>
			</div>

			<!-- for image-edit event -->
			<div class="card w-full bg-success text-primary-content lg:mr-10 lg:w-96">
				<div class="card-body">
					<h2 class="card-title">Card title!</h2>
					<p>
						A card component has a figure, a body part, and inside body there are title and actions
						parts
					</p>
					<div class="card-actions justify-end">
						<button class="btn">Buy Now</button>
					</div>
				</div>
			</div>

			<!-- for video creation event -->
			<div class="card w-full bg-info text-primary-content lg:w-96">
				<div class="card-body">
					<h2 class="card-title">Card title!</h2>
					<p>
						A card component has a figure, a body part, and inside body there are title and actions
						parts
					</p>
					<div class="card-actions justify-end">
						<button class="btn">Buy Now</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Textarea and button stack on mobile, side-by-side on large screens -->
		<div class="modal-action mt-10 flex w-full flex-col items-center gap-2 px-4">
			<!-- Chat bubbles area -->
			<div class=" chat grid grid-flow-row-dense grid-cols-3 grid-rows-3">
				{#each messages as message, i (i)}
					<div class=" grid w-full">
						{message.role}
						{#if message.role === 'user'}
							<div class="max-h-12 max-w-12">
								<div class="rounded-full">
									<img class="max-h-12 max-w-12" alt="Chats for postify" src={hisImage} />
								</div>
							</div>
						{:else}
							<div class="max-h-12 max-w-12">
								<div class="rounded-full">
									<img class="max-h-12 max-w-12" alt="Chats for postify" src={myImage} />
								</div>
							</div>
						{/if}
					</div>

					{#each message.parts as part, j (j)}
						{#if part.type === 'text'}
							<div class="max-h-96 w-full space-y-4 overflow-y-auto rounded-lg bg-base-200 p-4">
								{part.text}
								<div class="chat-footer opacity-50">Delivered</div>
							</div>
						{/if}
					{/each}
				{/each}
			</div>
			<div class="flex w-full flex-col items-center gap-2 px-4">
				<p class="text-center">Get some Ideas or ask me anything.</p>
				<div class="flex w-full flex-col items-stretch gap-4 lg:max-w-2xl lg:flex-row">
					<!-- Alternative chat message list -->
					<!-- <ul class="mb-4 max-h-64 space-y-2 overflow-y-auto">
						{#each messages as message, i (i)}
							<li class="rounded-lg bg-gray-800 p-3">
								<div class="text-sm text-gray-400">{message.role}</div>
								<div class="mt-1">
									{#each message.parts as part, j (j)}
										{#if part.type === 'text'}
											<div>{part.text}</div>
										{/if}
									{/each}
								</div>
							</li>
						{/each}
					</ul> -->

					<form on:submit|preventDefault={handleSubmit} method="dialog" class="px w-full lg:w-428">
						<textarea
							bind:value={input}
							placeholder="Type your idea..."
							class="textarea min-h-[100px] w-full bg-base-100 textarea-info lg:flex-1"
						></textarea>

						<button
							type="submit"
							class="btn mt-6 btn-wide btn-outline btn-xs btn-info sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl"
						>
							Send
						</button>
					</form>
				</div>
			</div>
		</div>
		<div class="flex justify-between">
			<button class="btn order-1 btn-outline btn-info" on:click={() => modalRef?.close()}>
				Close
			</button>
		</div>
	</div>
</dialog>
