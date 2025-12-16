<!-- src/lib/components/ThreeJsEnhancer/ThreeJsText.svelte -->
<!-- 3D TEXT RENDERER - TROIKA VERSION - NO INFINITE LOOPS -->

<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { Text } from 'troika-three-text';
	import { text3DState } from '$lib/stores/text3d.store';

	export let scene: THREE.Scene | undefined;

	let textMesh: any = null;
	let isInitialized = false;

	$: textState = $text3DState;

	// React to scene becoming available
	$: if (scene && !isInitialized) {
		console.log('✅ Scene became available, initializing text...');
		createTextMesh();
		isInitialized = true;
	}

	// Watch specific properties that should trigger updates
	// This prevents infinite loops by not watching the entire state object
	$: if (isInitialized && textMesh) {
		// Only update when text is enabled
		if (textState.enabled) {
			updateTextProperties();
		} else {
			hideText();
		}
	}

	onMount(() => {
		console.log('🎨 ThreeJsText mounted, scene exists?', !!scene);

		return () => {
			console.log('🧹 Cleaning up ThreeJsText...');
			if (textMesh && scene) {
				scene.remove(textMesh);
				textMesh.dispose();
				textMesh = null;
			}
			isInitialized = false;
		};
	});

	function createTextMesh() {
		if (!scene) {
			console.error('❌ Cannot create text mesh: scene is undefined');
			return;
		}

		textMesh = new Text();
		textMesh.text = textState.text || 'Sample Text';
		textMesh.fontSize = textState.fontSize / 50;
		textMesh.color = textState.materialColor;
		textMesh.anchorX = 'center';
		textMesh.anchorY = 'middle';

		// Use font URL with default Roboto .ttf fallback (Troika needs TTF, not WOFF2!)
		const defaultRobotoUrl =
			'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmTggvWl0Qn.ttf';
		textMesh.font = textState.fontUrl || defaultRobotoUrl;

		scene.add(textMesh);

		// DEBUG: Expose for testing
		(window as any).__textMesh = textMesh;

		// Initial sync
		textMesh.sync();
		console.log('✅ Troika text mesh created');
	}

	function updateTextProperties() {
		if (!textMesh) return;

		console.log('🔄 Updating text properties...');

		// Text content
		const newText = textState.text || 'Sample Text';

		// Use font URL if available, otherwise use a default Roboto .ttf URL
		// CRITICAL: Troika needs TTF files, NOT woff2!
		const defaultRobotoUrl =
			'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmTggvWl0Qn.ttf';
		const newFont = textState.fontUrl || defaultRobotoUrl;

		console.log(`🔤 Font URL to use: ${newFont}`);

		// Check if font changed - if so, force full recreation
		const fontChanged = textMesh.font !== newFont;

		if (fontChanged) {
			console.log(`🔤 Font changing from "${textMesh.font}" to "${newFont}"`);

			// Dispose old text mesh
			if (scene) {
				scene.remove(textMesh);
			}
			textMesh.dispose();

			// Create new text mesh with new font
			textMesh = new Text();
			textMesh.font = newFont; // This is now a URL!
			textMesh.text = newText;
			textMesh.fontSize = textState.fontSize / 50;
			textMesh.anchorX = 'center';
			textMesh.anchorY = 'middle';

			if (scene) {
				scene.add(textMesh);
			}

			console.log(`✅ Text mesh recreated with font URL: ${newFont}`);
		} else {
			// Font didn't change, just update text
			textMesh.text = newText;
		}

		// Set font URL
		textMesh.font = newFont;

		// Size and scale
		textMesh.fontSize = textState.fontSize / 50;
		textMesh.scale.setScalar(textState.scale3D);

		// Color
		textMesh.color = new THREE.Color(textState.materialColor);

		// Position
		textMesh.position.set(textState.position3D.x, textState.position3D.y, textState.position3D.z);

		// Rotation
		textMesh.rotation.set(textState.rotation3D.x, textState.rotation3D.y, textState.rotation3D.z);

		// Opacity
		textMesh.fillOpacity = 1.0;

		// Outline (bevel effect)
		if (textState.bevelEnabled) {
			textMesh.outlineWidth = textState.bevelThickness * 0.5;
			textMesh.outlineColor = new THREE.Color(textState.materialColor).multiplyScalar(0.5);
			textMesh.outlineOpacity = 1.0;
		} else {
			textMesh.outlineWidth = 0;
		}

		// Emissive glow
		if (textState.emissiveIntensity > 0) {
			textMesh.outlineWidth = 0.1;
			textMesh.outlineColor = new THREE.Color(textState.emissive);
			textMesh.outlineOpacity = textState.emissiveIntensity;
			textMesh.outlineBlur = 0.3;
		}

		// Stroke (depth effect)
		if (textState.extrudeDepth > 0) {
			textMesh.strokeWidth = textState.extrudeDepth * 0.15;
			textMesh.strokeColor = new THREE.Color(textState.materialColor).multiplyScalar(0.3);
			textMesh.strokeOpacity = 0.9;
		} else {
			textMesh.strokeWidth = 0;
		}

		// Metalness effect
		if (textState.metalness > 0.5) {
			textMesh.color = new THREE.Color(textState.materialColor).multiplyScalar(
				1 - textState.metalness * 0.3
			);
		}

		// Alignment
		textMesh.anchorX = 'center';
		textMesh.anchorY = 'middle';
		textMesh.textAlign = 'center';
		textMesh.maxWidth = 20;
		textMesh.whiteSpace = 'normal';
		textMesh.visible = true;

		// Sync to apply all changes
		textMesh.sync();

		console.log(
			`✅ Updated: "${textState.text}" | Font: ${textState.fontFamily} | Size: ${textState.fontSize}`
		);
	}

	function hideText() {
		if (textMesh) {
			textMesh.visible = false;
			textMesh.sync();
		}
	}

	// Export animation function for ThreeJsScene to call
	export function updateAnimation() {
		if (!textMesh || !textState.enabled || !textMesh.visible) return;

		if (textState.autoRotate) {
			textMesh.rotation.y += textState.autoRotateSpeed;
			textMesh.sync();
		}

		switch (textState.animationType) {
			case 'spin':
				textMesh.rotation.y += 0.02;
				textMesh.sync();
				break;
			case 'wave':
				textMesh.position.y = textState.position3D.y + Math.sin(Date.now() * 0.001) * 0.5;
				textMesh.sync();
				break;
			case 'float':
				textMesh.position.y = textState.position3D.y + Math.sin(Date.now() * 0.002) * 0.3;
				textMesh.rotation.y += 0.005;
				textMesh.sync();
				break;
			case 'none':
			default:
				if (!textState.autoRotate) {
					textMesh.rotation.set(
						textState.rotation3D.x,
						textState.rotation3D.y,
						textState.rotation3D.z
					);
					textMesh.sync();
				}
				break;
		}
	}
</script>
