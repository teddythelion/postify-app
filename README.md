# 🏭 Content Factory

A professional AI-powered media creation suite built with **SvelteKit**. This application bridges the gap between high-level creative prompts and complex production tasks, integrating **Google Vertex AI (Veo)**, **OpenAI GPT Models, OpenAi (DALL-E 3)**,**Anthropic AI** and **Three.js** for a complete "text-to-media" workflow.

## 🚀 Key Features

* **AI Creative Assistant**: A chat interface driven by Anthropics AI and the Vercel AI SDK to help brainstorm and refine prompts.
* **Video Generation (Veo)**: Produce 4-8 second high-fidelity videos from text or reference images using Google's Veo 2.0 and 3.1 models.
* **Image Studio**: Generate 1024x1024 DALL-E 3 images with deep Zod-based prompt validation.
* **3D Enhancement**: An interactive Three.js workspace for adding particle systems, 3D typography (Troika), and cinematic effects to generated media.
* **Server-Side Media Processing**: Advanced FFmpeg integration for applying filters (sepia, blur, pixelate) and re-encoding video for optimal playback.

## 📂 Project Structure

The project follows a standard SvelteKit directory structure, separating UI, server-side logic, and reactive state.

```text
src/
├── app.html                # Main HTML entry point (Dracula theme)
├── routes/                 # 📂 ROUTING SYSTEM
│   ├── +layout.svelte      # Shared UI (Sidebar, Footer, Global Styles)
│   ├── +page.svelte        # HOME: AI Chat Creative Assistant
│   ├── texttoimage/        # 🖼️ Text-to-Image (DALL-E 3)
│   ├── texttovideo/        # 🎬 Text-to-Video (Veo 2.0/3.1)
│   ├── imageedit/          # 🎨 3D Enhancement & Image Modification
│   └── api/                # 🤖 SERVER ENDPOINTS
│       ├── imageGen/       # OpenAI integration
│       ├── processVideo/   # WASM-based video filtering
│       ├── proxyVideo/     # CORS-bypass for media streaming
│       └── veo2-simple/    # Vertex AI generation & polling suite
└── lib/                    # 🛠️ INTERNAL LIBRARY ($lib)
    ├── stores/             # Global Svelte Stores (3D, Video, Text)
    ├── utils/              # Memory-safe storage & Canvas-to-Video capture
    └── types/              # Troika 3D Text type definitions
