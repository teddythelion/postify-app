<script lang="ts">
    import NavButtons from '$lib/components/landing/NavButtons.svelte';
	import { onMount } from 'svelte';
	let scrolled = false;
	
	onMount(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 10;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>
<div class="navbar bg-transparent fixed top-0 left-0 right-0 z-50 backdrop-blur-md {scrolled ? 'shadow-lg' : ''}">

	<div class="navbar-start">
		<div class="dropdown">
			<button type="button" class="btn btn-ghost lg:hidden" aria-label="Open menu">
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
						d="M4 6h16M4 12h8m-8 6h16"
					/>
				</svg>
			</button>
			<ul class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
				<li><a href="#item1">Item 1</a></li>
				<li>
					<a href="#parent">Parent</a>
					<ul class="p-2">
						<li><a href="#submenu1">Submenu 1</a></li>
						<li><a href="#submenu2">Submenu 2</a></li>
					</ul>
				</li>
				<li><a href="#item3">Item 3</a></li>
			</ul>
		</div>
		<a href="/" class="btn btn-ghost text-xl">Postify</a>
	</div>
	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal px-1">
			<li><a href="#item1">Item 1</a></li>
			<li>
				<details>
					<summary>Parent</summary>
					<ul class="p-2 bg-base-100">
						<li><a href="#submenu1">Submenu 1</a></li>
						<li><a href="#submenu2">Submenu 2</a></li>
					</ul>
				</details>
			</li>
			<li><a href="#item3">Item 3</a></li>
		</ul>
	</div>
	<div class="navbar-end">
		<NavButtons />
	</div>
</div>