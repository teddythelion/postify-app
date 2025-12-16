<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import myImage from '$lib/assets/my-image.png';
	import hisImage from '$lib/assets/his-image.png';

	let inputUser = '';
	let chatContainer: HTMLDivElement | undefined;

	const chat = new Chat({});
	let input = '';
	const { messages } = chat;

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		inputUser = input;

		if (!input.trim()) return;
		chat.sendMessage({ text: input }).catch((err) => console.error('Chat error:', err));
		input = '';

		// Scroll to bottom after new message
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 0);
	}
</script>

<!-- Header -->
<div class="mb-6 text-center">
	<h1 class="text-3xl font-bold text-primary md:text-4xl">Content Factory</h1>
	<p class="mt-2 text-sm text-base-content/70 md:text-base">
		Your creative assistant for video, images, and more
	</p>
</div>

<!-- Chat Container -->
<div
	class="card flex flex-col items-center bg-base-100 shadow-xl"
	style="height: calc(100vh - 200px);"
>
	<div class="card-body flex h-full flex-col p-4 md:w-4/5 md:p-6 lg:w-4/5 xl:w-2/3 2xl:w-1/2">
		<!-- Messages Area -->
		<div
			bind:this={chatContainer}
			class="mb-4 flex-1 space-y-4 overflow-y-auto rounded-lg bg-base-200/50 p-4"
		>
			{#each messages as message (message.id)}
				<div class="flex gap-3 {message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
					<!-- Avatar -->
					<div class="shrink-0">
						<div class="avatar transition-transform duration-200 hover:scale-105">
							<div class="w-10 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
								<img
									src={message.role === 'user' ? myImage : hisImage}
									alt="{message.role} avatar"
								/>
							</div>
						</div>
					</div>

					<!-- Message Bubble -->
					<div
						class="flex max-w-[75%] flex-col {message.role === 'user'
							? 'items-end'
							: 'items-start'}"
					>
						<div class="mb-1 text-xs font-semibold text-base-content/60">
							{message.role === 'user' ? 'You' : 'AI Assistant'}
						</div>
						<div
							class="rounded-2xl px-4 py-3 shadow-md {message.role === 'user'
								? 'rounded-br-none bg-primary text-primary-content'
								: 'rounded-bl-none bg-base-300 text-base-content'}"
						>
							{#each message.parts as part}
								{#if part.type === 'text'}
									<p class="leading-relaxed wrap-break-word whitespace-pre-wrap">{part.text}</p>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			{/each}

			<!-- Empty State -->
			{#if messages.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-4 h-16 w-16 text-primary/40"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
					<p class="text-lg font-semibold text-base-content/70">Start a conversation</p>
					<p class="mt-2 text-sm text-base-content/50">
						Ask me anything or get creative ideas for your content
					</p>
				</div>
			{/if}
		</div>

		<!-- Input Section -->
		<div class="border-t border-base-300 pt-4">
			<form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
				<div class="form-control">
					<textarea
						bind:value={input}
						placeholder="Ask me to write a prompt that will produce the best results for Generating images or video..."
						class="textarea-bordered textarea min-h-[100px] w-full resize-none bg-base-200 textarea-primary focus:textarea-primary"
						rows="3"
					></textarea>
				</div>
				<div class="flex items-center justify-between">
					<p class="text-xs text-base-content/50">
						💡 Use the sidebar to access specialized tools and use the prompts you generated above
					</p>
					<button type="submit" class="btn gap-2 btn-primary" disabled={!input.trim()}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
							/>
						</svg>
						Send
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
