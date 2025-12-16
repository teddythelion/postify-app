// FILE STRUCTURE FOR VIDEO ENHANCER
// ===================================

// DIRECTORY LAYOUT:
// src/
// ├── routes/
// │   ├── texttovideo/
// │   │   └── +page.svelte                    (Main page - orchestrator)
// │   ├── api/
// │   │   ├── processVideoEffects/
// │   │   │   └── +server.ts                  (KEEP - FFmpeg effects encoding)
// │   │   ├── proxyVideo/
// │   │   │   └── +server.ts                  (KEEP - CORS proxy for videos)
// │   │   └── encodeThreeJsVideo/
// │   │       └── +server.ts                  (KEEP - FFmpeg 3D video encoding)
// │   │
// ├── lib/
// │   ├── components/
// │   │   ├── VideoEnhancer.svelte            (DELETE - OLD, replaced by VideoEffectsPanel)
// │   │   ├── ThreeJSEnhancer.svelte          (DELETE - OLD, replaced by ThreeJsEnhancer)
// │   │   ├── VideoEffectsPanel.svelte        (KEEP - Canvas video effects)
// │   │   └── ThreeJsEnhancer/
// │   │       ├── ThreeJsEnhancer.svelte      (Main 3D component)
// │   │       ├── ThreeJsScene.svelte         (Scene management)
// │   │       ├── ControlsPanel.svelte        (UI controls)
// │   │       └── index.ts                    (Export all)
// │   │
// │   ├── stores/
// │   │   ├── videoEffects.store.ts           (Video effects state)
// │   │   ├── threeJs.store.ts                (3D scene state)
// │   │   ├── video.store.ts                  (Video file state)
// │   │   └── index.ts                        (Export all stores)
// │   │
// │   └── utils/
// │       ├── videoCapture.ts                 (3D frame capture logic)
// │       ├── videoEffects.ts                 (FFmpeg filter helpers)
// │       └── encoding.ts                     (Base64/Blob utilities)

// ============================================
// FILE DELETION GUIDE
// ============================================

/**
 * DELETE THESE FILES:
 * 
 * ❌ src/lib/components/VideoEnhancer.svelte
 *    - OLD VERSION of effects panel
 *    - Replaced by VideoEffectsPanel.svelte
 *    - Reason: Duplicate, outdated styling
 * 
 * ❌ src/lib/components/ThreeJSEnhancer.svelte
 *    - OLD VERSION of 3D enhancer
 *    - Will be replaced by ThreeJsEnhancer/ folder structure
 *    - Reason: Getting refactored into modular components
 */

// ============================================
// FILE RELATIONSHIPS & DEPENDENCIES
// ============================================

/**
 * FOR VIDEO EFFECTS PANEL:
 * 
 * texttovideo/+page.svelte
 *   ↓ imports
 * VideoEffectsPanel.svelte
 *   ↓ imports
 * videoEffects.store.ts (state management)
 * video.store.ts (video file state)
 *   ↓ calls API
 * routes/api/processVideoEffects/+server.ts (FFmpeg encoding)
 * routes/api/proxyVideo/+server.ts (CORS proxy)
 */

/**
 * FOR THREE.JS ENHANCER:
 * 
 * texttovideo/+page.svelte
 *   ↓ imports
 * ThreeJsEnhancer/ThreeJsEnhancer.svelte (main component)
 *   ↓ imports
 * ThreeJsEnhancer/ThreeJsScene.svelte (3D logic)
 * ThreeJsEnhancer/ControlsPanel.svelte (UI)
 * videoCapture.ts (frame capture)
 *   ↓ imports
 * threeJs.store.ts (3D state)
 * video.store.ts (video state)
 *   ↓ calls API
 * routes/api/encodeThreeJsVideo/+server.ts (FFmpeg frame encoding)
 * routes/api/proxyVideo/+server.ts (CORS proxy)
 */

// ============================================
// STORE FILES TO CREATE
// ============================================

// src/lib/stores/video.store.ts
/**
 * Shared video state between both enhancers
 * - videoUrl: string
 * - processedVideoUrl: string | null
 * - isVideoLoaded: boolean
 * - videoError: string | null
 */

// src/lib/stores/videoEffects.store.ts
/**
 * Video effects panel state only
 * - brightness, contrast, saturation, hue, blur, etc.
 * - isPlaying, isCapturing
 * - effects object
 */

// src/lib/stores/threeJs.store.ts
/**
 * 3D scene state only
 * - selectedShape, rotationX/Y/Z, cameraDistance, scale
 * - autoRotate, autoRotateSpeed
 * - ambientIntensity, directionalIntensity
 * - particlesEnabled, particleColor, etc.
 */

// ============================================
// UTILITY FILES TO CREATE
// ============================================

// src/lib/utils/videoCapture.ts
/**
 * Functions:
 * - captureThreeJsFrames(videoElement, canvas, fps, duration)
 * - prepareFrameData(frames, width, height)
 * - sendToEncoder(frameData, width, height, fps, count)
 */

// src/lib/utils/videoEffects.ts
/**
 * Functions:
 * - buildFFmpegFilters(effects)
 * - applyCanvasFilters(ctx, effects)
 */

// src/lib/utils/encoding.ts
/**
 * Functions:
 * - base64ToBlob(base64, mimeType)
 * - blobToBase64(blob)
 * - downloadFile(url, filename)
 */

// ============================================
// IMPORT EXAMPLES
// ============================================

/**
 * In a component:
 * 
 * import { threeJsState, videoState } from '$lib/stores';
 * import { captureThreeJsFrames } from '$lib/utils/videoCapture';
 * import { downloadFile } from '$lib/utils/encoding';
 * 
 * Then use:
 * let shape = $threeJsState.selectedShape;
 * let videoUrl = $videoState.videoUrl;
 * 
 * threeJsState.update(state => ({
 *   ...state,
 *   selectedShape: 'cube'
 * }));
 */
 //notes ==src/lib/components/ThreeJSEnhancer.svelte IS FOR IMAGES