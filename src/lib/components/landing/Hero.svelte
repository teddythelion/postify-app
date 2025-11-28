<script lang="ts">
	import heroImage from '../../assets/hero.jpeg';
	import MyModal from './modal/Modal.svelte';
	let my_modal: HTMLDialogElement | undefined;
</script>

<div class="hero min-h-screen" style:background-image="url({heroImage})">
	<div class="hero-overlay"></div>
	<div class="hero-content text-center text-neutral-content">
		<div class="max-w-md">
			<h1 class="mb-5 text-5xl font-bold">Work Smarter!!!!</h1>
			<p class="mb-5">
				How many hours do you spend editing and creating content? Even a single Image meme could
				take hours to create. Try Postify and save time!
			</p>
			<MyModal bind:modalRef={my_modal} />

			<button class="btn" on:click={() => my_modal?.showModal()}>Start Here</button>
		</div>
	</div>
</div>
