<!-- src/lib/components/ThreeJsEnhancer/ControlsPanel.svelte -->
<!-- UPDATED: Unified 3D Text Controls with Troika Features -->

<script lang="ts">
	import { threeJsState } from '$lib/stores/threeJs.store';
	import { videoState } from '$lib/stores/video.store';
	import { text3DState } from '$lib/stores/text3d.store';
	import { captureThreeJsVideo } from '$lib/utils/videoCapture';
	import CaptureProgressOverlay from './CaptureProgressOverlay.svelte';
	import GoogleFonts from '$lib/components/textOverlay/GoogleFonts.svelte';

	// Capture progress state
	let captureProgress = 0;
	let captureMessage = '';
	let showCaptureProgress = false;

	const shapes = ['sphere', 'cube', 'cylinder', 'torus', 'icosahedron', 'plane'];

	interface ControlGroup {
		id: string;
		title: string;
		items: ControlItem[];
	}

	interface ControlItem {
		label: string;
		type: 'range' | 'toggle' | 'select' | 'button' | 'color' | 'text' | 'component';
		min?: number;
		max?: number;
		step?: number;
		component?: any;
		componentProps?: Record<string, any>;
		options?: Array<{ value: string; label: string }> | string[];
		action?: () => void;
	}

	function handleFontSelection(fontFamily: string, fontUrl: string) {
		text3DState.setFontWithUrl(fontFamily, fontUrl);
	}

	$: controlGroups = [
		{
			id: 'shape',
			title: 'Shape & Transform',
			items: [
				{
					label: 'Shape',
					type: 'select',
					options: shapes.map((s) => ({
						value: s,
						label: s.charAt(0).toUpperCase() + s.slice(1)
					}))
				},
				{
					label: 'Camera Distance',
					type: 'range',
					min: 2,
					max: 15,
					step: 0.1
				},
				{
					label: 'Scale',
					type: 'range',
					min: 0.5,
					max: 3,
					step: 0.1
				}
			]
		},
		{
			id: 'rotation',
			title: 'Rotation',
			items: [
				{
					label: 'X Rotation',
					type: 'range',
					min: -3.14,
					max: 3.14,
					step: 0.01
				},
				{
					label: 'Y Rotation',
					type: 'range',
					min: -3.14,
					max: 3.14,
					step: 0.01
				},
				{
					label: 'Z Rotation',
					type: 'range',
					min: -3.14,
					max: 3.14,
					step: 0.01
				},
				{
					label: 'Auto Rotate',
					type: 'toggle'
				},
				{
					label: 'Auto Rotate Speed',
					type: 'range',
					min: 0.001,
					max: 0.05,
					step: 0.001
				},
				{
					label: 'Reset Rotation',
					type: 'button',
					action: () => threeJsState.resetRotation()
				}
			]
		},
		{
			id: 'lighting',
			title: 'Lighting',
			items: [
				{
					label: 'Ambient',
					type: 'range',
					min: 0,
					max: 2,
					step: 0.1
				},
				{
					label: 'Directional',
					type: 'range',
					min: 0,
					max: 2,
					step: 0.1
				}
			]
		},
		{
			id: 'effects',
			title: 'Video Effects',
			items: [
				{
					label: 'Video Glow',
					type: 'range',
					min: 0,
					max: 2,
					step: 0.1
				},
				{
					label: 'Shape Glow',
					type: 'range',
					min: 0,
					max: 2,
					step: 0.1
				}
			]
		},
		{
			id: 'particles',
			title: 'Particle System',
			items: [
				{
					label: 'Enable Particles',
					type: 'toggle'
				},
				{
					label: 'Particle Count',
					type: 'range',
					min: 1000,
					max: 20000,
					step: 1000
				},
				{
					label: 'Particle Size',
					type: 'range',
					min: 0.01,
					max: 0.2,
					step: 0.01
				},
				{
					label: 'Particle Speed',
					type: 'range',
					min: 0.1,
					max: 2,
					step: 0.1
				},
				{
					label: 'Particle Spread',
					type: 'range',
					min: 5,
					max: 20,
					step: 1
				},
				{
					label: 'Particle Color',
					type: 'color'
				},
				{
					label: 'Particle Opacity',
					type: 'range',
					min: 0,
					max: 1,
					step: 0.1
				},
				{
					label: 'Particle Shape',
					type: 'select',
					options: [
						{ value: 'circle', label: '⚪ Circle' },
						{ value: 'square', label: '⬜ Square' },
						{ value: 'triangle', label: '🔺 Triangle' },
						{ value: 'star', label: '⭐ Star' },
						{ value: 'heart', label: '❤️ Heart' }
					]
				},
				{
					label: 'Animation',
					type: 'select',
					options: [
						{ value: 'none', label: 'None' },
						{ value: 'spiral', label: '🌀 Spiral' },
						{ value: 'wave', label: '🌊 Wave' },
						{ value: 'vortex', label: '🌪️ Vortex' },
						{ value: 'explosion', label: '💥 Explosion' },
						{ value: 'orbit', label: '🪐 Orbit' },
						{ value: 'pulse', label: '💓 Pulse' },
						{ value: 'fountain', label: '⛲ Fountain' }
					]
				},
				{
					label: 'Animation Speed',
					type: 'range',
					min: 0.1,
					max: 5,
					step: 0.1
				},
				{
					label: 'Color Mode',
					type: 'select',
					options: [
						{ value: 'solid', label: '🎨 Solid Color' },
						{ value: 'gradient', label: '🌈 Gradient' },
						{ value: 'rainbow', label: '🌈 Rainbow' }
					]
				},
				{
					label: 'Gradient Color 2',
					type: 'color'
				},
				{
					label: 'Glow Effect',
					type: 'toggle'
				},
				{
					label: 'Particle Rotation',
					type: 'toggle'
				}
			]
		},
		{
			id: 'text3d',
			title: '✨ 3D Text & Typography',
			items: [
				// === ENABLE/DISABLE ===
				{
					label: 'Enable 3D Text',
					type: 'toggle'
				},

				// === CONTENT ===
				{
					label: 'Text Content',
					type: 'text'
				},

				// === GOOGLE FONTS SELECTOR ===
				{
					label: 'Font Family',
					type: 'component',
					component: GoogleFonts,
					componentProps: {
						selectedFont: $text3DState.fontFamily,
						onFontSelect: handleFontSelection
					}
				},

				// === SIZE & SCALE ===
				{
					label: 'Font Size',
					type: 'range',
					min: 20,
					max: 200,
					step: 5
				},
				{
					label: 'Text Scale',
					type: 'range',
					min: 0.1,
					max: 3,
					step: 0.1
				},

				// === 3D DEPTH EFFECTS ===
				{
					label: 'Extrude Depth',
					type: 'range',
					min: 0,
					max: 2,
					step: 0.1
				},
				{
					label: 'Bevel Enabled',
					type: 'toggle'
				},
				{
					label: 'Bevel Thickness',
					type: 'range',
					min: 0,
					max: 0.5,
					step: 0.05
				},

				// === POSITION ===
				{
					label: 'Position X',
					type: 'range',
					min: -10,
					max: 10,
					step: 0.1
				},
				{
					label: 'Position Y',
					type: 'range',
					min: -10,
					max: 10,
					step: 0.1
				},
				{
					label: 'Position Z',
					type: 'range',
					min: -10,
					max: 10,
					step: 0.1
				},

				// === ROTATION ===
				{
					label: 'Rotation X',
					type: 'range',
					min: -3.14,
					max: 3.14,
					step: 0.01
				},
				{
					label: 'Rotation Y',
					type: 'range',
					min: -3.14,
					max: 3.14,
					step: 0.01
				},
				{
					label: 'Rotation Z',
					type: 'range',
					min: -3.14,
					max: 3.14,
					step: 0.01
				},

				// === MATERIAL PROPERTIES ===
				{
					label: 'Material Color',
					type: 'color'
				},
				{
					label: 'Metalness',
					type: 'range',
					min: 0,
					max: 1,
					step: 0.1
				},
				{
					label: 'Roughness',
					type: 'range',
					min: 0,
					max: 1,
					step: 0.1
				},

				// === EMISSIVE/GLOW ===
				{
					label: 'Emissive Color',
					type: 'color'
				},
				{
					label: 'Emissive Intensity',
					type: 'range',
					min: 0,
					max: 2,
					step: 0.1
				},

				// === ANIMATION ===
				{
					label: 'Auto Rotate Text',
					type: 'toggle'
				},
				{
					label: 'Auto Rotate Speed',
					type: 'range',
					min: 0.001,
					max: 0.1,
					step: 0.001
				},
				{
					label: 'Text Animation',
					type: 'select',
					options: [
						{ value: 'none', label: 'None' },
						{ value: 'spin', label: '🔄 Spin' },
						{ value: 'wave', label: '🌊 Wave' },
						{ value: 'float', label: '☁️ Float' }
					]
				},

				// === PRESETS ===
				{
					label: '💎 Bold Title Preset',
					type: 'button',
					action: () => text3DState.presets.title()
				},
				{
					label: '✨ Subtle Subtitle Preset',
					type: 'button',
					action: () => text3DState.presets.subtitle()
				},
				{
					label: '🌟 Neon Glow Preset',
					type: 'button',
					action: () => text3DState.presets.neon()
				},
				{
					label: '🏆 Gold Classic Preset',
					type: 'button',
					action: () => text3DState.presets.gold()
				},
				{
					label: '🔄 Reset Text Transform',
					type: 'button',
					action: () => text3DState.resetTransform()
				}
			]
		}
	] as ControlGroup[];

	// FIXED: Use direct store access with $ syntax for reactivity
	function getControlValue(groupId: string, label: string): number | string | boolean {
		if (groupId === 'text3d') {
			switch (label) {
				case 'Enable 3D Text':
					return $text3DState.enabled;
				case 'Text Content':
					return $text3DState.text;
				case 'Font Size':
					return $text3DState.fontSize;
				case 'Text Scale':
					return $text3DState.scale3D;
				case 'Extrude Depth':
					return $text3DState.extrudeDepth;
				case 'Bevel Enabled':
					return $text3DState.bevelEnabled;
				case 'Bevel Thickness':
					return $text3DState.bevelThickness;
				case 'Position X':
					return $text3DState.position3D.x;
				case 'Position Y':
					return $text3DState.position3D.y;
				case 'Position Z':
					return $text3DState.position3D.z;
				case 'Rotation X':
					return $text3DState.rotation3D.x;
				case 'Rotation Y':
					return $text3DState.rotation3D.y;
				case 'Rotation Z':
					return $text3DState.rotation3D.z;
				case 'Material Color':
					return $text3DState.materialColor;
				case 'Metalness':
					return $text3DState.metalness;
				case 'Roughness':
					return $text3DState.roughness;
				case 'Emissive Color':
					return $text3DState.emissive;
				case 'Emissive Intensity':
					return $text3DState.emissiveIntensity;
				case 'Auto Rotate Text':
					return $text3DState.autoRotate;
				case 'Auto Rotate Speed':
					return $text3DState.autoRotateSpeed;
				case 'Text Animation':
					return $text3DState.animationType;
			}
		}

		// Shape controls
		switch (label) {
			case 'Shape':
				return $threeJsState.selectedShape;
			case 'Camera Distance':
				return $threeJsState.cameraDistance;
			case 'Scale':
				return $threeJsState.scale;
			case 'X Rotation':
				return $threeJsState.rotationX;
			case 'Y Rotation':
				return $threeJsState.rotationY;
			case 'Z Rotation':
				return $threeJsState.rotationZ;
			case 'Auto Rotate':
				return $threeJsState.autoRotate;
			case 'Auto Rotate Speed':
				return $threeJsState.autoRotateSpeed;
			case 'Ambient':
				return $threeJsState.ambientIntensity;
			case 'Directional':
				return $threeJsState.directionalIntensity;
			case 'Video Glow':
				return $threeJsState.videoGlow;
			case 'Shape Glow':
				return $threeJsState.shapeGlow;
			case 'Enable Particles':
				return $threeJsState.particlesEnabled;
			case 'Particle Count':
				return $threeJsState.particleCount;
			case 'Particle Size':
				return $threeJsState.particleSize;
			case 'Particle Speed':
				return $threeJsState.particleSpeed;
			case 'Particle Spread':
				return $threeJsState.particleSpread;
			case 'Particle Color':
				return $threeJsState.particleColor;
			case 'Particle Opacity':
				return $threeJsState.particleOpacity;
			case 'Particle Shape':
				return $threeJsState.particleShape;
			case 'Animation':
				return $threeJsState.particleAnimation;
			case 'Animation Speed':
				return $threeJsState.particleAnimationSpeed;
			case 'Color Mode':
				return $threeJsState.particleColorMode;
			case 'Gradient Color 2':
				return $threeJsState.particleGradientColor;
			case 'Glow Effect':
				return $threeJsState.particleGlow;
			case 'Particle Rotation':
				return $threeJsState.particleRotation;
			default:
				return 0;
		}
	}

	function getNumberValue(groupId: string, label: string): number {
		const val = getControlValue(groupId, label);
		return typeof val === 'number' ? val : 0;
	}

	function getBooleanValue(groupId: string, label: string): boolean {
		const val = getControlValue(groupId, label);
		return typeof val === 'boolean' ? val : false;
	}

	function setControlValue(label: string, value: any) {
		// Shape controls
		switch (label) {
			case 'Shape':
				threeJsState.setShape(value);
				break;
			case 'Camera Distance':
				threeJsState.updateProperty('cameraDistance', value);
				break;
			case 'Scale':
				threeJsState.updateProperty('scale', value);
				break;
			case 'X Rotation':
				threeJsState.updateProperty('rotationX', value);
				break;
			case 'Y Rotation':
				threeJsState.updateProperty('rotationY', value);
				break;
			case 'Z Rotation':
				threeJsState.updateProperty('rotationZ', value);
				break;
			case 'Auto Rotate':
				threeJsState.updateProperty('autoRotate', value);
				break;
			case 'Auto Rotate Speed':
				threeJsState.updateProperty('autoRotateSpeed', value);
				break;
			case 'Ambient':
				threeJsState.updateProperty('ambientIntensity', value);
				break;
			case 'Directional':
				threeJsState.updateProperty('directionalIntensity', value);
				break;
			case 'Video Glow':
				threeJsState.updateProperty('videoGlow', value);
				break;
			case 'Shape Glow':
				threeJsState.updateProperty('shapeGlow', value);
				break;
			case 'Enable Particles':
				threeJsState.updateProperty('particlesEnabled', value);
				break;
			case 'Particle Count':
				threeJsState.updateProperty('particleCount', value);
				break;
			case 'Particle Size':
				threeJsState.updateProperty('particleSize', value);
				break;
			case 'Particle Speed':
				threeJsState.updateProperty('particleSpeed', value);
				break;
			case 'Particle Spread':
				threeJsState.updateProperty('particleSpread', value);
				break;
			case 'Particle Color':
				threeJsState.updateProperty('particleColor', value);
				break;
			case 'Particle Opacity':
				threeJsState.updateProperty('particleOpacity', value);
				break;
			case 'Particle Shape':
				threeJsState.updateProperty('particleShape', value);
				break;
			case 'Animation':
				threeJsState.updateProperty('particleAnimation', value);
				break;
			case 'Animation Speed':
				threeJsState.updateProperty('particleAnimationSpeed', value);
				break;
			case 'Color Mode':
				threeJsState.updateProperty('particleColorMode', value);
				break;
			case 'Gradient Color 2':
				threeJsState.updateProperty('particleGradientColor', value);
				break;
			case 'Glow Effect':
				threeJsState.updateProperty('particleGlow', value);
				break;
			case 'Particle Rotation':
				threeJsState.updateProperty('particleRotation', value);
				break;
		}

		// Text3D controls
		switch (label) {
			case 'Enable 3D Text':
				text3DState.updateProperty('enabled', value);
				break;
			case 'Text Content':
				text3DState.setText(value);
				break;
			case 'Font Size':
				text3DState.setFontSize(value);
				break;
			case 'Text Scale':
				text3DState.setScale(value);
				break;
			case 'Extrude Depth':
				text3DState.updateProperty('extrudeDepth', value);
				break;
			case 'Bevel Enabled':
				text3DState.updateProperty('bevelEnabled', value);
				break;
			case 'Bevel Thickness':
				text3DState.updateProperty('bevelThickness', value);
				break;
			case 'Position X':
				text3DState.updatePosition3D('x', value);
				break;
			case 'Position Y':
				text3DState.updatePosition3D('y', value);
				break;
			case 'Position Z':
				text3DState.updatePosition3D('z', value);
				break;
			case 'Rotation X':
				text3DState.updateRotation3D('x', value);
				break;
			case 'Rotation Y':
				text3DState.updateRotation3D('y', value);
				break;
			case 'Rotation Z':
				text3DState.updateRotation3D('z', value);
				break;
			case 'Material Color':
				text3DState.setColor(value);
				break;
			case 'Metalness':
				text3DState.updateProperty('metalness', value);
				break;
			case 'Roughness':
				text3DState.updateProperty('roughness', value);
				break;
			case 'Emissive Color':
				text3DState.updateProperty('emissive', value);
				break;
			case 'Emissive Intensity':
				text3DState.updateProperty('emissiveIntensity', value);
				break;
			case 'Auto Rotate Text':
				text3DState.toggleAutoRotate();
				break;
			case 'Auto Rotate Speed':
				text3DState.setAutoRotateSpeed(value);
				break;
			case 'Text Animation':
				text3DState.setAnimation(value);
				break;
		}
	}

	function getUnit(label: string): string {
		if (label.includes('Glow') || label.includes('Intensity')) return '';
		if (label.includes('Distance')) return 'm';
		if (label.includes('Speed') || label.includes('Rotation')) return '';
		return '';
	}

	async function handleCapture() {
		if (!$videoState.videoUrl || !$videoState.isVideoLoaded) return;

		threeJsState.setCapturing(true);
		showCaptureProgress = true;
		captureProgress = 0;
		captureMessage = 'Initializing...';

		try {
			await captureThreeJsVideo((progress, message) => {
				captureProgress = progress;
				captureMessage = message;
			});

			captureMessage = 'Video downloaded successfully!';
			setTimeout(() => {
				showCaptureProgress = false;
			}, 2000);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			alert(`Failed to capture video: ${errorMsg}`);
			showCaptureProgress = false;
		} finally {
			threeJsState.setCapturing(false);
		}
	}
</script>

<!-- Controls Panel - Right Side -->
<CaptureProgressOverlay
	isVisible={showCaptureProgress}
	progress={captureProgress}
	message={captureMessage}
/>

<div class="flex w-full flex-col gap-3 overflow-y-auto lg:w-96">
	<!-- Scrollable Controls Container -->
	<div class="flex flex-col gap-2 overflow-y-auto pr-2" style="max-height: calc(100vh - 200px);">
		{#each controlGroups as group}
			<div class="rounded-lg border border-white/10 bg-gray-800/50">
				<details class="group">
					<summary
						class="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
					>
						<span>{group.title}</span>
						<svg
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
							class="size-5 flex-none text-gray-500 transition-transform group-open:rotate-180"
						>
							<path
								d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
								clip-rule="evenodd"
								fill-rule="evenodd"
							/>
						</svg>
					</summary>

					<div class="px-2 pb-2">
						{#each group.items as item}
							{#if item.type === 'component'}
								<!-- RENDER COMPONENT (Google Fonts) -->
								<div class="rounded-lg p-3 hover:bg-white/5">
									<svelte:component this={item.component} {...item.componentProps} />
								</div>
							{:else if item.type === 'select'}
								<!-- SELECT CONTROL -->
								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-semibold text-white">{item.label}</span>
									</div>
									<select
										value={getControlValue(group.id, item.label)}
										on:change={(e) => setControlValue(item.label, e.currentTarget.value)}
										class="w-full rounded border border-white/10 bg-gray-700 px-2 py-1 text-xs text-white outline-none focus:border-white/20"
									>
										{#each item.options || [] as option}
											{#if typeof option === 'string'}
												<option value={option}>
													{option.charAt(0).toUpperCase() + option.slice(1)}
												</option>
											{:else}
												<option value={option.value}>
													{option.label}
												</option>
											{/if}
										{/each}
									</select>
								</div>
							{:else if item.type === 'toggle'}
								<!-- TOGGLE CONTROL -->
								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="flex items-center justify-between">
										<span class="text-sm font-semibold text-white">{item.label}</span>
										<label class="relative inline-flex cursor-pointer items-center">
											<input
												type="checkbox"
												checked={getBooleanValue(group.id, item.label)}
												on:change={(e) => setControlValue(item.label, e.currentTarget.checked)}
												class="peer sr-only"
											/>
											<div
												class="peer h-6 w-11 rounded-full bg-gray-700 peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
											></div>
										</label>
									</div>
								</div>
							{:else if item.type === 'button'}
								<!-- BUTTON CONTROL -->
								<div class="rounded-lg p-3 hover:bg-white/5">
									<button
										on:click={item.action}
										class="w-full rounded-lg border border-white/10 bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
									>
										{item.label}
									</button>
								</div>
							{:else if item.type === 'color'}
								<!-- COLOR PICKER -->
								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-semibold text-white">{item.label}</span>
									</div>
									<input
										type="color"
										value={getControlValue(group.id, item.label)}
										on:input={(e) => setControlValue(item.label, e.currentTarget.value)}
										class="h-8 w-full cursor-pointer rounded border border-white/10"
									/>
								</div>
							{:else if item.type === 'text'}
								<!-- TEXT INPUT -->
								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-semibold text-white">{item.label}</span>
									</div>
									<input
										type="text"
										value={getControlValue(group.id, item.label)}
										on:input={(e) => setControlValue(item.label, e.currentTarget.value)}
										class="w-full rounded border border-white/10 bg-gray-700 px-2 py-1 text-sm text-white outline-none focus:border-white/20"
										placeholder="Enter text..."
									/>
								</div>
							{:else if item.type === 'range'}
								<!-- RANGE SLIDER -->
								<div class="rounded-lg p-3 hover:bg-white/5">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-semibold text-white">{item.label}</span>
										<span class="text-xs text-gray-400">
											{getNumberValue(group.id, item.label).toFixed(2)}{getUnit(item.label)}
										</span>
									</div>
									<input
										type="range"
										min={item.min}
										max={item.max}
										step={item.step}
										value={getNumberValue(group.id, item.label)}
										on:input={(e) => setControlValue(item.label, parseFloat(e.currentTarget.value))}
										class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
									/>
									<input
										type="number"
										min={item.min}
										max={item.max}
										step={item.step}
										value={getNumberValue(group.id, item.label)}
										on:input={(e) => setControlValue(item.label, parseFloat(e.currentTarget.value))}
										class="mt-2 w-full rounded border border-white/10 bg-gray-700 px-2 py-1 text-xs text-white outline-none focus:border-white/20"
									/>
								</div>
							{/if}
						{/each}
					</div>
				</details>
			</div>
		{/each}
	</div>

	<!-- ACTION BUTTONS - Fixed at bottom -->
	<div class="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
		<button
			on:click={() => threeJsState.resetVisuals()}
			class="rounded-lg border border-white/10 bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700/50 disabled:opacity-50"
			disabled={$threeJsState.isCapturing}
		>
			🔄 Reset All
		</button>
		<button
			on:click={handleCapture}
			class="rounded-lg border border-white/10 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
			disabled={$threeJsState.isCapturing || !$videoState.isVideoLoaded}
		>
			{#if $threeJsState.isCapturing}
				🎥 Capturing...
			{:else}
				🎬 Capture & Encode
			{/if}
		</button>
	</div>
</div>

<style>
	/* Custom scrollbar styling */
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
