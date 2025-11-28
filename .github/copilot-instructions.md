# Copilot Instructions for Sand

## Architecture Overview

**Sand** is a SvelteKit-based AI application that combines chat and image generation capabilities. It uses the Vercel `ai` SDK to integrate with OpenAI's models (GPT and DALL-E).

### Key Components

- **Frontend**: Svelte 5 components in `src/routes/` using runes and reactive state (`$props()`, `bind:`)
- **Backend**: SvelteKit server routes (`+server.ts`) that handle API calls to OpenAI
- **Styling**: Tailwind CSS v4 with forms and typography plugins
- **Build**: Vite with SvelteKit adapter-auto for environment detection

### Data Flow

1. User input from `src/routes/+page.svelte` → Chat UI component
2. `handleSubmit` sends message via `Chat` class from `@ai-sdk/svelte`
3. Request hits `src/routes/api/chat/+server.ts` POST endpoint
4. Server streams response from OpenAI (gpt-5-nano model) back to client
5. Messages render in the UI with role and parts differentiation

## Development Workflow

### Essential Commands

```bash
npm run dev           # Start dev server (Vite + SvelteKit)
npm run build         # Production build
npm run check         # Type-check and svelte-check (required before commits)
npm run check:watch   # Watch mode for type checking
npm run lint          # Run prettier + eslint
npm run format        # Auto-format with prettier and tailwind
```

### Key Developer Patterns

- **Type Safety**: Strict TypeScript enabled (`"strict": true`). All components and server routes must be typed.
- **Svelte Runes**: Use modern Svelte 5 syntax (`$props()`, `bind:`, `let {}` destructuring) not pre-5.0 lifecycle APIs.
- **Server Routes**: API endpoints use `+server.ts` naming convention. The `POST` function receives `{ request }` context.
- **Import Aliases**: Use `$lib/` for library imports and `$env/` for environment variables (static private keys in `$env/static/private`).

## Critical Dependencies & Integration Points

### OpenAI Integration (`src/routes/api/chat/+server.ts`)

```typescript
// Pattern: Initialize OpenAI client with OPENAI_API_KEY
const openai = createOpenAI({ apiKey: OPENAI_API_KEY });

// Use streamText for real-time responses
const result = streamText({
    model: openai('gpt-5-nano'),
    messages: convertToModelMessages(messages), // Converts UIMessage to model format
});

return result.toUIMessageStreamResponse(); // Streams response directly to client
```

- **UIMessage Format**: Passed from client, must be converted to model format before sending to OpenAI
- **Streaming**: Always use `streamText()` for chat responses (not `generateText()`), enables real-time client updates

### Image Generation (`src/routes/api/video/+server.ts`)

- Uses `experimental_generateImage` from `ai` SDK
- Model: `openai.image('dall-e-3')`
- Returns base64 and Uint8Array image data
- Provider options: `{ style: 'vivid', quality: 'hd' }`

### Svelte Chat Component (`src/routes/+page.svelte`)

```svelte
const chat = new Chat({}); // Initialize with default config
chat.sendMessage({ text: input }); // Send message
// Access: chat.messages (array of UIMessage with role and parts)
```

## Code Conventions

### TypeScript Patterns

- **Strict Mode**: `strict: true` enforced in `tsconfig.json` - all code must pass type checking
- **Interface Typing**: Server route handlers use typed request/response patterns:
  ```typescript
  export async function POST({ request }: { request: Request }) {
      const data: { messages: UIMessage[] } = await request.json();
      // Return type should be Response or PromiseResponse
  }
  ```
- **Component Props**: Use Svelte 5 runes destructuring with typed `let {}`:
  ```svelte
  <script lang="ts">
      let { messages, onSend }: { messages: UIMessage[]; onSend: (msg: UIMessage) => void } = $props();
  </script>
  ```

### Eslint Rules

- Config in `eslint.config.js` uses flat config (ESLint 9+)
- Integrates TypeScript ESLint, Svelte plugin, and Prettier
- Key rule: `'no-undef': 'off'` disabled for TypeScript projects (TS handles undefined checks)
- All `.svelte` files parsed with TypeScript parser and `projectService: true` for full type awareness

### File Naming & Structure

- Route files: `+page.svelte`, `+layout.svelte`, `+server.ts` (SvelteKit convention)
- API routes: Placed under `src/routes/api/{endpoint}/+server.ts`
- Server exports: Named exports only (`export async function GET/POST/PUT/DELETE`)
- CSS: Global layout styles in `src/routes/layout.css`; component scoped styles via `<style>` blocks; Tailwind utility classes for styling

### Error Handling

- **Current State**: Minimal error handling; no try-catch in `+server.ts` routes or error boundaries in components
- **Recommendations**: 
  - Wrap `streamText()` and `generateImage()` calls in try-catch
  - Return proper error responses with status codes (400, 500)
  - Add Svelte error pages (`src/routes/+error.svelte`) for error UI
  - Consider error boundaries at layout level

### Logging

- **Current**: Console logs present in `+page.svelte` (`console.log('chat')`)
- **Best Practice**: Replace with structured logging library or server-side logging for production
- **Debug Mode**: Dev environment suitable for console logs; strip before production build

## Environment Setup

- **OPENAI_API_KEY**: Required private environment variable for API calls (injected via `$env/static/private`)
- **Package Manager**: pnpm (from `pnpm-workspace.yaml` and `pnpm-lock.yaml`)
- **Node Version**: TypeScript targets module resolution "bundler"; ensure Node 18+ compatibility

## Workspace Structure (pnpm Monorepo)

- **Root Config**: `pnpm-workspace.yaml` defines this as a workspace (currently single package `sand`)
- **Package Manager**: pnpm required (not npm or yarn) - uses `pnpm-lock.yaml` for dependency locking
- **Scalability**: Structure supports adding multiple packages under workspace root in future

## Advanced Patterns

### Message Format & Conversion

The `ai` SDK uses two message formats that must be converted:

- **UIMessage** (client-side): `{ role: 'user' | 'assistant', parts: Array<{ type: 'text', text: string }> }`
- **Model Message** (server-side): `{ role: 'user' | 'assistant', content: string }`
- **Conversion**: Use `convertToModelMessages(uiMessages)` before sending to OpenAI

### Streaming vs Non-Streaming

- **Chat**: Must use `streamText()` to enable real-time client updates via `toUIMessageStreamResponse()`
- **Images**: Uses `experimental_generateImage()` which returns immediately with base64/Uint8Array data
- **Client Hook**: `@ai-sdk/svelte` `Chat` class automatically handles stream consumption

## Form Validation Pattern (Recommended)

Project includes Zod but not yet used. Recommended pattern for `+server.ts`:

```typescript
import { z } from 'zod';

const messageSchema = z.object({
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), parts: z.array(z.any()) }))
});

export async function POST({ request }) {
    const data = messageSchema.parse(await request.json());
    // Validated data ready to use
}
```

## Semantic HTML & Accessibility Notes

- Current `+page.svelte` uses `<a href="api/video" class="h-6 bg-black ...">Send</a>` for button
- **Fix**: Replace with `<button>` element or `<a role="button">` with proper ARIA labels
- Forms should use `<label>` elements paired with inputs
- Chat messages should use `<section>` or `<article>` for semantic structure

## Testing Setup (Currently Absent)

- No test runner configured (Vitest would be natural choice with Vite + TypeScript)
- To add: Install `vitest` and `@vitest/ui`, create `src/**/*.test.ts` files
- Example server route test pattern:
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { POST } from './+server';
  
  describe('Chat API', () => {
      it('should handle valid messages', async () => {
          const request = new Request('http://localhost', {
              method: 'POST',
              body: JSON.stringify({ messages: [...] })
          });
          const response = await POST({ request });
          expect(response.status).toBe(200);
      });
  });
  ```

## Production Deployment Checklist

- [ ] Remove all `console.log` statements
- [ ] Add `.env.local` to `.gitignore` (if not already present)
- [ ] Set `OPENAI_API_KEY` in deployment environment
- [ ] Run `npm run check` to ensure type safety
- [ ] Run `npm run lint` to fix formatting and linting
- [ ] Test `npm run build` succeeds locally before deploying
- [ ] Consider adapter change from `adapter-auto` if deploying to specific platform (Node.js, Cloudflare, Vercel, etc.)
