<script lang="ts">
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo.png';
</script>

<div class="drawer lg:drawer-open">
	<input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content">
		<!-- Navbar -->
		<nav class="navbar w-full bg-base-300">
			<label for="my-drawer-4" aria-label="open sidebar" class="btn btn-square btn-ghost">
				<!-- Sidebar toggle icon -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					stroke-linejoin="round"
					stroke-linecap="round"
					stroke-width="2"
					fill="none"
					stroke="currentColor"
					class="my-1.5 inline-block size-4"
					><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"
					></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg
				>
			</label>

			<div class="ml-3 flex items-center gap-1">
				<img src={logo} alt="Content Factory Logo" class="h-8 w-auto sm:h-10" />
				<span class="text-lg font-semibold sm:text-xl">Content Factory</span>
			</div>
			<button class="btn ml-auto max-h-9 btn-outline lg:inline-flex"> Login </button>
			<button class="btn ml-2 max-h-9 btn-outline lg:inline-flex"> Sign Up </button>
		</nav>
		<!-- Page content here -->
		<div class="p-4">
			<slot />
		</div>
	</div>

	<div class="drawer-side is-drawer-close:overflow-visible">
		<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
		<div
			class="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64"
		>
			<!-- Sidebar content here -->
			<ul class="menu w-full grow">
				<!-- Homepage -->
				<li>
					<a
						href="/"
						class="is-drawer-close:tooltip is-drawer-close:tooltip-right {$page.url.pathname === '/'
							? 'active'
							: ''}"
						data-tip="Homepage"
					>
						<!-- Home icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							stroke-linejoin="round"
							stroke-linecap="round"
							stroke-width="2"
							fill="none"
							stroke="currentColor"
							class="my-1.5 inline-block size-4"
							><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path
								d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
							></path></svg
						>
						<span class="is-drawer-close:hidden">Homepage</span>
					</a>
				</li>

				<!-- Text to Video -->
				<li>
					<a
						href="/texttovideo"
						class="is-drawer-close:tooltip is-drawer-close:tooltip-right {$page.url.pathname ===
						'/texttovideo'
							? 'active'
							: ''}"
						data-tip="Text or Image to Video with Editing"
					>
						<!-- Video icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							stroke-linejoin="round"
							stroke-linecap="round"
							stroke-width="2"
							fill="none"
							stroke="currentColor"
							class="my-1.5 inline-block size-4"
							><path d="M23 7l-7 5 7 5V7z"></path><rect
								x="1"
								y="5"
								width="15"
								height="14"
								rx="2"
								ry="2"
							></rect></svg
						>
						<span class="is-drawer-close:hidden">Text to Video</span>
					</a>
				</li>

				<!-- Text to Image -->
				<li>
					<a
						href="/texttoimage/texttoimage-enhanced.svelte"
						class="is-drawer-close:tooltip is-drawer-close:tooltip-right {$page.url.pathname ===
						'/texttoimage'
							? 'active'
							: ''}"
						data-tip="Text to Image"
					>
						<!-- Image icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							stroke-linejoin="round"
							stroke-linecap="round"
							stroke-width="2"
							fill="none"
							stroke="currentColor"
							class="my-1.5 inline-block size-4"
							><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle
								cx="8.5"
								cy="8.5"
								r="1.5"
							></circle><path d="M21 15l-5-5L5 21"></path></svg
						>
						<span class="is-drawer-close:hidden">Text to Image</span>
					</a>
				</li>

				<!-- Image Edit -->
				<li>
					<a
						href="/imageedit"
						class="is-drawer-close:tooltip is-drawer-close:tooltip-right {$page.url.pathname ===
						'/imageedit'
							? 'active'
							: ''}"
						data-tip="Image Edit with Ultra Refinement"
					>
						<!-- Edit icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							stroke-linejoin="round"
							stroke-linecap="round"
							stroke-width="2"
							fill="none"
							stroke="currentColor"
							class="my-1.5 inline-block size-4"
							><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path
								d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
							></path></svg
						>
						<span class="is-drawer-close:hidden">Image Edit</span>
					</a>
				</li>

				<!-- Settings -->
				<li>
					<a
						href="/settings"
						class="is-drawer-close:tooltip is-drawer-close:tooltip-right {$page.url.pathname ===
						'/settings'
							? 'active'
							: ''}"
						data-tip="Settings"
					>
						<!-- Settings icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							stroke-linejoin="round"
							stroke-linecap="round"
							stroke-width="2"
							fill="none"
							stroke="currentColor"
							class="my-1.5 inline-block size-4"
							><circle cx="12" cy="12" r="3"></circle><path
								d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m4.92 4.92l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m4.92-4.92l4.24-4.24"
							></path></svg
						>
						<span class="is-drawer-close:hidden">Settings</span>
					</a>
				</li>
			</ul>
		</div>
	</div>
</div>
