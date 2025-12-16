<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	export let imageUrl: string = '';
	export let onClose: () => void;
	import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
	import { FontLoader } from 'three/addons/loaders/FontLoader.js';

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let mesh: THREE.Mesh;
	let textMesh: THREE.Mesh | null = null;
	let animationId: number;
	let texture: THREE.Texture;

	// Control states
	let rotationX = 0;
	let rotationY = 0;
	let rotationZ = 0;
	let autoRotate = false;
	let autoRotateSpeed = 0.01;
	let cameraDistance = 5;
	let scale = 1;

	// Shape selection
	let selectedShape = 'plane';
	const shapes = ['plane', 'sphere', 'cube', 'cylinder', 'pyramid', 'torus'];

	// Lighting controls
	let ambientIntensity = 0.6;
	let directionalIntensity = 0.8;

	// Global blur and glow effects
	let globalBlur = 0;
	let imageGlow = 0;
	let shapeGlow = 0;

	// Text controls
	let textContent = '';
	let textSize = 1;
	let textColor = '#ffffff';
	let textOpacity = 1;
	let textGlow = 0;
	let textRotationX = 0;
	let textRotationY = 0;
	let textRotationZ = 0;
	let textPositionX = 0;
	let textPositionY = 0;
	let textPositionZ = 2;
	let textAutoRotate = false;
	let textAutoRotateSpeed = 0.01;
	let selectedFont = 'Roboto';
	let textDepth = 0.2;
	let textBevel = true;
	let textMode = '2d'; // '2d' or '3d'
	let selected3DFont = 'helvetiker';
	let textExtrusionDepth = 0.5;
	let bevelEnabled = true;
	let bevelThickness = 0.05;
	let bevelSize = 0.02;
	let loadedFont: any = null;

	// Popular Google Fonts list
	const googleFonts = [
		'Roboto',
		'Open Sans',
		'Lato',
		'Montserrat',
		'Oswald',
		'Raleway',
		'Poppins',
		'Merriweather',
		'Playfair Display',
		'Bebas Neue',
		'Pacifico',
		'Righteous',
		'Bangers',
		'Press Start 2P',
		'Permanent Marker',
		'Caveat'
	];
	const threejsFonts = [
		{ name: 'Helvetiker', value: 'helvetiker' },
		{ name: 'Optimer', value: 'optimer' },
		{ name: 'Gentilis', value: 'gentilis' },
		{ name: 'Droid Sans', value: 'droid_sans' },
		{ name: 'Droid Serif', value: 'droid_serif' }
	];

	let ambientLight: THREE.AmbientLight;
	let directionalLight: THREE.DirectionalLight;
	let composer: any;

	onMount(() => {
		if (!imageUrl) return;
		loadGoogleFonts();
		initThreeJS();
		return () => {
			if (animationId) cancelAnimationFrame(animationId);
			if (renderer) renderer.dispose();
			if (texture) texture.dispose();
		};
	});

	function loadGoogleFonts() {
		const link = document.createElement('link');
		link.href = `https://fonts.googleapis.com/css2?${googleFonts.map((font) => `family=${font.replace(/ /g, '+')}`).join('&')}&display=swap`;
		link.rel = 'stylesheet';
		document.head.appendChild(link);
	}

	function load3DFont(fontName: string) {
		const loader = new FontLoader();
		const fontPath = `https://threejs.org/examples/fonts/${fontName}_regular.typeface.json`;

		loader.load(
			fontPath,
			(font) => {
				loadedFont = font;
				if (textMode === '3d') {
					create3DText();
				}
			},
			undefined,
			(error) => {
				console.error('Error loading 3D font:', error);
			}
		);
	}

	function initThreeJS() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x1a1a1a);

		camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
		camera.position.z = cameraDistance;

		renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);

		ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
		scene.add(ambientLight);

		directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
		directionalLight.position.set(5, 5, 5);
		scene.add(directionalLight);

		const textureLoader = new THREE.TextureLoader();
		textureLoader.load(
			imageUrl,
			(loadedTexture) => {
				texture = loadedTexture;
				createMesh(selectedShape);
				animate();
			},
			undefined,
			(error) => {
				console.error('Error loading texture:', error);
			}
		);

		window.addEventListener('resize', handleResize);
	}

	function createMesh(shape: string) {
		if (mesh) {
			scene.remove(mesh);
			mesh.geometry.dispose();
			if (Array.isArray(mesh.material)) {
				mesh.material.forEach((mat) => mat.dispose());
			} else {
				mesh.material.dispose();
			}
		}

		let geometry: THREE.BufferGeometry;

		switch (shape) {
			case 'sphere':
				geometry = new THREE.SphereGeometry(2, 64, 64);
				break;
			case 'cube':
				geometry = new THREE.BoxGeometry(3, 3, 3);
				break;
			case 'cylinder':
				geometry = new THREE.CylinderGeometry(2, 2, 3, 64);
				break;
			case 'pyramid':
				geometry = new THREE.ConeGeometry(2, 3, 4);
				break;
			case 'torus':
				geometry = new THREE.TorusGeometry(2, 0.8, 32, 100);
				break;
			case 'plane':
			default:
				const image = texture.image as HTMLImageElement;
				const aspectRatio = image.width / image.height;
				const planeWidth = 6;
				const planeHeight = planeWidth / aspectRatio;
				geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
				break;
		}

		const material = new THREE.MeshStandardMaterial({
			map: texture,
			side: THREE.DoubleSide,
			metalness: 0.1,
			roughness: 0.7,
			emissive: new THREE.Color(0xffffff),
			emissiveIntensity: imageGlow
		});

		mesh = new THREE.Mesh(geometry, material);
		mesh.scale.set(scale, scale, scale);
		scene.add(mesh);
	}

	function create3DText() {
		if (!textContent.trim()) {
			if (textMesh) {
				scene.remove(textMesh);
				textMesh.geometry.dispose();
				(textMesh.material as THREE.Material).dispose();
				textMesh = null;
			}
			return;
		}

		if (textMesh) {
			scene.remove(textMesh);
			textMesh.geometry.dispose();
			(textMesh.material as THREE.Material).dispose();
		}

		if (textMode === '2d') {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d')!;
			canvas.width = 512;
			canvas.height = 256;

			ctx.font = `bold ${80}px "${selectedFont}", sans-serif`;
			ctx.fillStyle = textColor;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			if (textGlow > 0) {
				ctx.shadowColor = textColor;
				ctx.shadowBlur = textGlow * 20;
			}

			ctx.fillText(textContent, canvas.width / 2, canvas.height / 2);

			const textTexture = new THREE.CanvasTexture(canvas);
			const textGeometry = new THREE.PlaneGeometry(4, 2);
			const textMaterial = new THREE.MeshStandardMaterial({
				map: textTexture,
				transparent: true,
				opacity: textOpacity,
				side: THREE.DoubleSide,
				emissive: new THREE.Color(textColor),
				emissiveIntensity: textGlow
			});

			textMesh = new THREE.Mesh(textGeometry, textMaterial);
			textMesh.position.set(textPositionX, textPositionY, textPositionZ);
			textMesh.scale.set(textSize, textSize, textSize);
			scene.add(textMesh);
		} else if (textMode === '3d') {
			if (!loadedFont) {
				load3DFont(selected3DFont);
				return;
			}

			const textGeometry = new TextGeometry(textContent, {
				font: loadedFont,
				size: 0.5,
				depth: textExtrusionDepth,
				curveSegments: 12,
				bevelEnabled: bevelEnabled,
				bevelThickness: bevelThickness,
				bevelSize: bevelSize,
				bevelSegments: 5
			});

			textGeometry.computeBoundingBox();
			const centerOffset =
				-0.5 * (textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x);
			textGeometry.translate(centerOffset, 0, 0);

			const textMaterial = new THREE.MeshStandardMaterial({
				color: new THREE.Color(textColor),
				transparent: true,
				opacity: textOpacity,
				emissive: new THREE.Color(textColor),
				emissiveIntensity: textGlow,
				metalness: 0.3,
				roughness: 0.4
			});

			textMesh = new THREE.Mesh(textGeometry, textMaterial);
			textMesh.position.set(textPositionX, textPositionY, textPositionZ);
			textMesh.scale.set(textSize, textSize, textSize);
			scene.add(textMesh);
		}
	}

	function switchTextMode(mode: '2d' | '3d') {
		textMode = mode;
		if (mode === '3d' && !loadedFont) {
			load3DFont(selected3DFont);
		} else {
			create3DText();
		}
	}

	function animate() {
		animationId = requestAnimationFrame(animate);

		if (mesh) {
			mesh.rotation.x = rotationX;
			mesh.rotation.y = rotationY;
			mesh.rotation.z = rotationZ;

			if (autoRotate) {
				mesh.rotation.y += autoRotateSpeed;
			}

			if (mesh.material instanceof THREE.MeshStandardMaterial) {
				mesh.material.emissiveIntensity = imageGlow + shapeGlow;
			}
		}

		if (textMesh) {
			textMesh.rotation.x = textRotationX;
			textMesh.rotation.y = textRotationY;
			textMesh.rotation.z = textRotationZ;

			if (textAutoRotate) {
				textMesh.rotation.y += textAutoRotateSpeed;
			}

			textMesh.position.set(textPositionX, textPositionY, textPositionZ);
			textMesh.scale.set(textSize, textSize, textSize);

			if (textMesh.material instanceof THREE.MeshStandardMaterial) {
				textMesh.material.opacity = textOpacity;
				textMesh.material.emissiveIntensity = textGlow;
			}
		}

		camera.position.z = cameraDistance;

		if (ambientLight) ambientLight.intensity = ambientIntensity;
		if (directionalLight) directionalLight.intensity = directionalIntensity;

		renderer.render(scene, camera);
	}

	function handleResize() {
		if (!canvas || !camera || !renderer) return;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	}

	function resetRotation() {
		rotationX = 0;
		rotationY = 0;
		rotationZ = 0;
	}

	function resetAll() {
		rotationX = 0;
		rotationY = 0;
		rotationZ = 0;
		cameraDistance = 5;
		scale = 1;
		autoRotate = false;
		autoRotateSpeed = 0.01;
		ambientIntensity = 0.6;
		directionalIntensity = 0.8;
		globalBlur = 0;
		imageGlow = 0;
		shapeGlow = 0;
		selectedShape = 'plane';
		textContent = '';
		textSize = 1;
		textOpacity = 1;
		textGlow = 0;
		textRotationX = 0;
		textRotationY = 0;
		textRotationZ = 0;
		textPositionX = 0;
		textPositionY = 0;
		textPositionZ = 2;
		textAutoRotate = false;
		createMesh(selectedShape);
		create3DText();
	}

	function exportImage() {
		if (!renderer) return;
		renderer.render(scene, camera);
		const dataURL = canvas.toDataURL('image/png');
		const link = document.createElement('a');
		link.download = `enhanced-image-${Date.now()}.png`;
		link.href = dataURL;
		link.click();
	}

	// Reactive statements
	$: if (mesh && texture && selectedShape) {
		createMesh(selectedShape);
	}

	$: if (mesh) {
		mesh.scale.set(scale, scale, scale);
	}

	$: if (
		textContent ||
		textSize ||
		textColor ||
		textOpacity ||
		textGlow ||
		selectedFont ||
		textMode ||
		selected3DFont ||
		textExtrusionDepth ||
		bevelEnabled ||
		bevelThickness ||
		bevelSize
	) {
		create3DText();
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/90 p-4">
	<div class="flex h-full w-full max-w-7xl flex-col gap-4 lg:flex-row">
		<!-- Three.js Canvas -->
		<div class="flex flex-1 flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-white">3D Image Enhancement</h2>
				<button
					on:click={onClose}
					class="btn btn-circle btn-ghost btn-sm"
					aria-label="Close enhancer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="relative flex-1 overflow-hidden rounded-lg bg-base-300">
				<canvas bind:this={canvas} class="h-full w-full"></canvas>
			</div>
		</div>

		<!-- CONTROLS PANEL - MATCHING ControlsPanel.svelte EXACTLY -->
		<div class="flex w-full flex-col gap-3 overflow-y-auto lg:w-96">
			<div
				class="flex flex-col gap-2 overflow-y-auto pr-2"
				style="max-height: calc(100vh - 200px);"
			>
				<!-- SHAPE SELECTION -->
				<div class="rounded-lg border border-white/10 bg-gray-800/50">
					<details class="group" open>
						<summary
							class="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
						>
							<span>Shape & Transform</span>
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-5 flex-none text-gray-500 transition-transform group-open:rotate-180"
							>
								<path
									d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
								/>
							</svg>
						</summary>
						<div class="px-2 pb-2">
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">3D Shape</span>
								</div>
								<select
									bind:value={selectedShape}
									class="w-full rounded border border-white/10 bg-gray-700 px-2 py-1 text-xs text-white outline-none focus:border-white/20"
								>
									{#each shapes as shape}
										<option value={shape}>{shape.charAt(0).toUpperCase() + shape.slice(1)}</option>
									{/each}
								</select>
							</div>

							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Camera Distance</span>
									<span class="text-xs text-gray-400">{cameraDistance.toFixed(1)}</span>
								</div>
								<input
									type="range"
									min="2"
									max="15"
									step="0.1"
									bind:value={cameraDistance}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Scale</span>
									<span class="text-xs text-gray-400">{scale.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0.5"
									max="3"
									step="0.1"
									bind:value={scale}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>
						</div>
					</details>
				</div>

				<!-- ROTATION -->
				<div class="rounded-lg border border-white/10 bg-gray-800/50">
					<details class="group">
						<summary
							class="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
						>
							<span>Rotation</span>
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-5 flex-none text-gray-500 transition-transform group-open:rotate-180"
							>
								<path
									d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
								/>
							</svg>
						</summary>
						<div class="px-2 pb-2">
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">X Rotation</span>
									<span class="text-xs text-gray-400">{rotationX.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="-3.14"
									max="3.14"
									step="0.01"
									bind:value={rotationX}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Y Rotation</span>
									<span class="text-xs text-gray-400">{rotationY.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="-3.14"
									max="3.14"
									step="0.01"
									bind:value={rotationY}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Z Rotation</span>
									<span class="text-xs text-gray-400">{rotationZ.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="-3.14"
									max="3.14"
									step="0.01"
									bind:value={rotationZ}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Auto Rotate</span>
									<label class="relative inline-flex cursor-pointer items-center">
										<input type="checkbox" bind:checked={autoRotate} class="peer sr-only" />
										<div
											class="peer h-6 w-11 rounded-full bg-gray-700 peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
										></div>
									</label>
								</div>
							</div>

							{#if autoRotate}
								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-semibold text-white">Auto Rotate Speed</span>
										<span class="text-xs text-gray-400">{autoRotateSpeed.toFixed(3)}</span>
									</div>
									<input
										type="range"
										min="0.001"
										max="0.05"
										step="0.001"
										bind:value={autoRotateSpeed}
										class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
									/>
								</div>
							{/if}

							<div class="rounded-lg p-3 hover:bg-white/5">
								<button
									on:click={resetRotation}
									class="w-full rounded-lg border border-white/10 bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
								>
									Reset Rotation
								</button>
							</div>
						</div>
					</details>
				</div>

				<!-- LIGHTING -->
				<div class="rounded-lg border border-white/10 bg-gray-800/50">
					<details class="group">
						<summary
							class="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
						>
							<span>Lighting</span>
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-5 flex-none text-gray-500 transition-transform group-open:rotate-180"
							>
								<path
									d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
								/>
							</svg>
						</summary>
						<div class="px-2 pb-2">
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Ambient</span>
									<span class="text-xs text-gray-400">{ambientIntensity.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0"
									max="2"
									step="0.1"
									bind:value={ambientIntensity}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Directional</span>
									<span class="text-xs text-gray-400">{directionalIntensity.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0"
									max="2"
									step="0.1"
									bind:value={directionalIntensity}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>
						</div>
					</details>
				</div>

				<!-- EFFECTS -->
				<div class="rounded-lg border border-white/10 bg-gray-800/50">
					<details class="group">
						<summary
							class="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
						>
							<span>Image Effects</span>
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-5 flex-none text-gray-500 transition-transform group-open:rotate-180"
							>
								<path
									d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
								/>
							</svg>
						</summary>
						<div class="px-2 pb-2">
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Image Glow</span>
									<span class="text-xs text-gray-400">{imageGlow.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0"
									max="2"
									step="0.1"
									bind:value={imageGlow}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Shape Glow</span>
									<span class="text-xs text-gray-400">{shapeGlow.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0"
									max="2"
									step="0.1"
									bind:value={shapeGlow}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>
						</div>
					</details>
				</div>

				<!-- TEXT ENHANCEMENT -->
				<div class="rounded-lg border border-white/10 bg-gray-800/50">
					<details class="group">
						<summary
							class="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
						>
							<span>Text Enhancement</span>
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-5 flex-none text-gray-500 transition-transform group-open:rotate-180"
							>
								<path
									d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
								/>
							</svg>
						</summary>
						<div class="px-2 pb-2" style="max-height: 400px; overflow-y: auto;">
							<!-- Text Mode Toggle -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Text Mode</span>
								</div>
								<div class="flex gap-2">
									<button
										on:click={() => switchTextMode('2d')}
										class="flex-1 rounded border border-white/10 px-3 py-1.5 text-xs font-semibold transition-colors {textMode ===
										'2d'
											? 'bg-blue-600 text-white'
											: 'bg-gray-700 text-white hover:bg-gray-600'}"
									>
										2D Canvas
									</button>
									<button
										on:click={() => switchTextMode('3d')}
										class="flex-1 rounded border border-white/10 px-3 py-1.5 text-xs font-semibold transition-colors {textMode ===
										'3d'
											? 'bg-blue-600 text-white'
											: 'bg-gray-700 text-white hover:bg-gray-600'}"
									>
										3D Extruded
									</button>
								</div>
							</div>

							<!-- Text Content -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Text Content</span>
								</div>
								<input
									type="text"
									bind:value={textContent}
									placeholder="Enter text..."
									class="w-full rounded border border-white/10 bg-gray-700 px-2 py-1 text-sm text-white outline-none focus:border-white/20"
								/>
							</div>

							<!-- Font Selection -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white"
										>Font Family {textMode === '3d' ? '(3D)' : '(2D)'}</span
									>
								</div>
								{#if textMode === '2d'}
									<select
										bind:value={selectedFont}
										class="w-full rounded border border-white/10 bg-gray-700 px-2 py-1 text-xs text-white outline-none focus:border-white/20"
									>
										{#each googleFonts as font}
											<option value={font}>{font}</option>
										{/each}
									</select>
								{:else}
									<select
										bind:value={selected3DFont}
										on:change={() => load3DFont(selected3DFont)}
										class="w-full rounded border border-white/10 bg-gray-700 px-2 py-1 text-xs text-white outline-none focus:border-white/20"
									>
										{#each threejsFonts as font}
											<option value={font.value}>{font.name}</option>
										{/each}
									</select>
								{/if}
							</div>

							{#if textMode === '3d'}
								<!-- 3D Settings -->
								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-semibold text-white">Extrusion Depth</span>
										<span class="text-xs text-gray-400">{textExtrusionDepth.toFixed(2)}</span>
									</div>
									<input
										type="range"
										min="0.1"
										max="2"
										step="0.1"
										bind:value={textExtrusionDepth}
										class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
									/>
								</div>

								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="flex items-center justify-between">
										<span class="text-sm font-semibold text-white">Enable Bevel</span>
										<label class="relative inline-flex cursor-pointer items-center">
											<input type="checkbox" bind:checked={bevelEnabled} class="peer sr-only" />
											<div
												class="peer h-6 w-11 rounded-full bg-gray-700 peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
											></div>
										</label>
									</div>
								</div>

								{#if bevelEnabled}
									<div class="rounded-lg p-3 hover:bg-white/5">
										<div class="mb-2 flex items-center justify-between">
											<span class="text-sm font-semibold text-white">Bevel Thickness</span>
											<span class="text-xs text-gray-400">{bevelThickness.toFixed(3)}</span>
										</div>
										<input
											type="range"
											min="0.01"
											max="0.5"
											step="0.01"
											bind:value={bevelThickness}
											class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
										/>
									</div>

									<div class="rounded-lg p-3 hover:bg-white/5">
										<div class="mb-2 flex items-center justify-between">
											<span class="text-sm font-semibold text-white">Bevel Size</span>
											<span class="text-xs text-gray-400">{bevelSize.toFixed(3)}</span>
										</div>
										<input
											type="range"
											min="0.01"
											max="0.3"
											step="0.01"
											bind:value={bevelSize}
											class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
										/>
									</div>
								{/if}
							{/if}

							<!-- Text Size -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Text Size</span>
									<span class="text-xs text-gray-400">{textSize.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0.5"
									max="3"
									step="0.1"
									bind:value={textSize}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Text Color -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Text Color</span>
								</div>
								<input
									type="color"
									bind:value={textColor}
									class="h-8 w-full cursor-pointer rounded border border-white/10"
								/>
							</div>

							<!-- Text Opacity -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Opacity</span>
									<span class="text-xs text-gray-400">{textOpacity.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0"
									max="1"
									step="0.1"
									bind:value={textOpacity}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Text Glow -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Glow</span>
									<span class="text-xs text-gray-400">{textGlow.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0"
									max="2"
									step="0.1"
									bind:value={textGlow}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Position Section Header -->
							<div class="px-3 py-2">
								<span class="text-xs font-semibold text-gray-400">POSITION</span>
							</div>

							<!-- Position X -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">X Position</span>
									<span class="text-xs text-gray-400">{textPositionX.toFixed(1)}</span>
								</div>
								<input
									type="range"
									min="-5"
									max="5"
									step="0.1"
									bind:value={textPositionX}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Position Y -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Y Position</span>
									<span class="text-xs text-gray-400">{textPositionY.toFixed(1)}</span>
								</div>
								<input
									type="range"
									min="-5"
									max="5"
									step="0.1"
									bind:value={textPositionY}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Position Z -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Z Position</span>
									<span class="text-xs text-gray-400">{textPositionZ.toFixed(1)}</span>
								</div>
								<input
									type="range"
									min="-5"
									max="10"
									step="0.1"
									bind:value={textPositionZ}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Rotation Section Header -->
							<div class="px-3 py-2">
								<span class="text-xs font-semibold text-gray-400">ROTATION</span>
							</div>

							<!-- Rotation X -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">X Rotation</span>
									<span class="text-xs text-gray-400">{textRotationX.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="-3.14"
									max="3.14"
									step="0.01"
									bind:value={textRotationX}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Rotation Y -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Y Rotation</span>
									<span class="text-xs text-gray-400">{textRotationY.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="-3.14"
									max="3.14"
									step="0.01"
									bind:value={textRotationY}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Rotation Z -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Z Rotation</span>
									<span class="text-xs text-gray-400">{textRotationZ.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="-3.14"
									max="3.14"
									step="0.01"
									bind:value={textRotationZ}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
								/>
							</div>

							<!-- Auto Rotate -->
							<div class="rounded-lg p-3 hover:bg-white/5">
								<div class="flex items-center justify-between">
									<span class="text-sm font-semibold text-white">Auto Rotate</span>
									<label class="relative inline-flex cursor-pointer items-center">
										<input type="checkbox" bind:checked={textAutoRotate} class="peer sr-only" />
										<div
											class="peer h-6 w-11 rounded-full bg-gray-700 peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
										></div>
									</label>
								</div>
							</div>

							{#if textAutoRotate}
								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-semibold text-white">Auto Rotate Speed</span>
										<span class="text-xs text-gray-400">{textAutoRotateSpeed.toFixed(3)}</span>
									</div>
									<input
										type="range"
										min="0.001"
										max="0.05"
										step="0.001"
										bind:value={textAutoRotateSpeed}
										class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
									/>
								</div>
							{/if}
						</div>
					</details>
				</div>
			</div>

			<!-- ACTION BUTTONS -->
			<div class="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
				<button
					on:click={resetAll}
					class="rounded-lg border border-white/10 bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700/50"
				>
					Reset All
				</button>
				<button
					on:click={exportImage}
					class="rounded-lg border border-white/10 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
				>
					Export Image
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar styling - MATCHING ControlsPanel */
	::-webkit-scrollbar {
		width: 8px;
	}

	::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	summary::-webkit-details-marker {
		display: none;
	}
</style>
