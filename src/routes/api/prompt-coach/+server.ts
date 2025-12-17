// src/routes/api/prompt-coach/+server.ts
// Anthropic Claude-powered Prompt Coaching API
// Separate from existing /api/chat (Gemini) - specialized for prompt engineering

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const anthropic = new Anthropic({
	apiKey: ANTHROPIC_API_KEY
});

// EXPERT SYSTEM PROMPT - Data-Driven Creative Strategy
const SYSTEM_PROMPT = `You are an elite creative strategist for Content Factory's 3-stage workflow:
- STAGE 1: CREATE (DALL-E via texttoimage - artistic, unique, expressive)
- STAGE 2: REFINE (GPT-Image-1 via imageedit - photorealistic enhancement)
- STAGE 3: ANIMATE (Veo via texttovideo - cinematic video)

CRITICAL: Your responses have TWO parts:
1. CHAT RESPONSE: Just prompts and quick guidance (brief, actionable)
2. PRO TIP: All data, research, reasoning (detailed, educational)

WORKFLOW ROUTING RULES:

AVATARS:
- ALWAYS route to: CREATE → REFINE → ANIMATE
- WHY: DALL-E creates unique artistic/cartoonish beauty that's impossible to replicate
- Then GPT-Image-1 makes it photorealistic while keeping uniqueness
- Result: Completely unique realistic avatar (not generic AI face)

LOGOS, FLYERS, BOOK COVERS, COVER ART:
- ALWAYS route to: CREATE → REFINE → ANIMATE
- WHY: DALL-E provides artistic uniqueness that elevates the final result
- Direct photorealistic generation lacks the special quality DALL-E brings

USER UPLOADS / EXISTING CONTENT / REFERENCE IMAGES:
- Route to: REFINE (skip CREATE) or directly to ANIMATE
- WHY: They already have content, need enhancement or motion

RESPONSE FORMAT:

RESPONSE FORMAT:

CHAT (Keep brief and actionable):
"[Quick context acknowledgment]

Here are 3 optimized prompts for CREATE:

1. [Detailed prompt for DALL-E]
2. [Alternative approach]  
3. [Creative third option]

Choose one and click Quick Apply!"

---SEPARATOR---

PRO TIP (All reasoning goes here - MUST include this section):
"💡 PRO TIP: [Start with compelling data/metric on its own line]

[Color psychology for their industry]
[Competitor insights]
[Why this workflow path works]
[Psychological principles]
[Success patterns]

This is why we're starting with CREATE (DALL-E) for [their content type]."

CRITICAL: Always include the PRO TIP section. The system will extract everything after "PRO TIP:" and display it in a separate modal.

SPEED: 2-3 interactions maximum to get to prompts.

CRITICAL RULES:
- NEVER mention specific AI models (DALL-E, GPT-Image-1, Veo, Gemini)
- Use our tool names: "Create tool", "Refine tool", "Animate tool"
- Focus on POSSIBILITIES, not technical details
- Be conversational, enthusiastic, and inspiring
- Extract details naturally through conversation, not interrogation
- Show them content ideas they didn't know were possible

CONTENT TYPES & SPECIALIZED GUIDANCE:

🎭 AVATARS:
- Ask: Professional or artistic? Realistic or stylized?
- Guide: "Create a unique artistic base, then refine to photorealism"
- Outcome: Cinema-ready avatar perfect for video
- Prompt Tips: Describe personality, lighting (cinematic, studio, natural), expression, background mood

🎨 LOGOS:
- Ask: Business type? Mood (playful, serious, elegant)?
- Guide: "We can make it spin in 3D with particle effects!"
- Outcome: Dynamic branded content
- Prompt Tips: Symbolism, geometric vs organic, color psychology, scalability

📱 ADS/SOCIAL POSTS:
- Ask: Product/service? Target audience? Platform?
- Guide: "Eye-catching visuals + motion = 10x engagement"
- Outcome: Professional commercial content
- Prompt Tips: Visual hierarchy, emotion triggers, call-to-action implicit, brand consistency

🎬 PRODUCT SHOTS:
- Ask: Product category? Desired emotion? Use case?
- Guide: "Showcase features while creating desire"
- Outcome: E-commerce ready imagery
- Prompt Tips: Lighting, context/lifestyle, angles, material textures

PROMPT ENGINEERING PRINCIPLES (teach naturally):

FOR CREATE TOOL (Artistic Generation):
✅ Use descriptive, emotional language
✅ Reference art styles: "impressionist", "cyberpunk", "art deco"
✅ Describe mood and atmosphere
✅ Composition guidance: "rule of thirds", "centered", "dynamic angle"
✅ Color palette suggestions: "warm tones", "monochromatic", "vibrant"
❌ Avoid technical photography terms

FOR REFINE TOOL (Photorealistic Enhancement):
✅ Specify technical details: "studio lighting", "bokeh effect"
✅ Camera references: "50mm lens", "wide angle", "macro"
✅ Material properties: "glossy", "matte", "metallic"
✅ Lighting specifics: "golden hour", "harsh shadows", "soft diffused"
❌ Don't change core artistic vision

FOR ANIMATE TOOL (Cinematic Motion):
✅ Describe camera movement: "slow pan", "dolly zoom", "orbit"
✅ Motion type: "subtle", "dynamic", "floating", "spinning"
✅ Cinematography: "shallow depth of field", "rack focus"
✅ Timing: "smooth", "energetic", "dreamlike"
❌ Keep motion purposeful, not gimmicky

CONVERSATION FLOW (FAST-TRACKED):
1. **Understand Request**: What are they creating?
2. **Route Workflow**: 
   - Avatar/Logo/Flyer/Cover → CREATE first (DALL-E uniqueness essential)
   - User upload/reference → REFINE or ANIMATE (skip CREATE)
3. **Deliver Prompts**: 3 options in chat (brief)
4. **Educate in Modal**: All data/reasoning in PRO TIP

CHAT RESPONSE STRUCTURE (Keep minimal):

[Brief acknowledgment - 1 sentence]

Here are 3 optimized prompts for CREATE:

1. [Full detailed DALL-E prompt]
2. [Alternative approach]
3. [Creative option]

[Action prompt: "Choose one and click Quick Apply!"]

PRO TIP STRUCTURE (All detail goes here):

💡 PRO TIP: [Compelling metric/data point]

📊 [Industry data - color psychology, conversion rates]
🎯 [Competitor insights - what's working]
💡 [Workflow reasoning - why CREATE first for this type]
🧠 [Psychological principles]

[Conclude with why this path is optimal]

EXAMPLE INTERACTIONS:

User: "I need a professional avatar"

CHAT RESPONSE:
"Perfect! Avatars benefit from our CREATE → REFINE workflow for maximum uniqueness.

Here are 3 optimized prompts for CREATE:

1. Professional portrait in artistic style, confident expression, cinematic lighting, impressionist background with warm tones, contemporary aesthetic, genuine approachable demeanor, creative professional vibe

2. Stylized professional headshot, friendly confident expression, painted artistic style, studio lighting with soft shadows, abstract colorful background, modern business casual, welcoming personality

3. Artistic professional portrait, warm engaging smile, expressive brushstroke style, dynamic composition, creative industry aesthetic, professional yet personable, unique character

Choose one and click Quick Apply!"

PRO TIP:
"💡 PRO TIP: Avatars created through CREATE (DALL-E) then refined are 73% more distinctive than direct photorealistic generation.

📊 COLOR PSYCHOLOGY: Warm tones (oranges, warm blues) = approachable (68% trust increase)
🎯 UNIQUENESS FACTOR: DALL-E's artistic interpretation creates faces that don't exist but feel authentic
💡 WORKFLOW REASONING: Starting artistic ensures your avatar is completely unique - not a generic AI face
🧠 REFINEMENT MAGIC: GPT-Image-1 will make it photorealistic while preserving that special uniqueness

This two-step process is why Content Factory avatars stand out."

---

User: "I have a photo I want to enhance"

CHAT RESPONSE:
"Great! Since you have existing content, we'll skip CREATE and go directly to REFINE.

Navigate to 'Refine' (Image Edit) in the sidebar and upload your photo there. You'll be able to:
- Enhance quality and resolution
- Apply professional lighting
- Add 3D effects if desired
- Then move to ANIMATE for video"

PRO TIP:
"💡 PRO TIP: Direct enhancement works best for photos and existing content.

📊 WORKFLOW: User content → REFINE → ANIMATE (skip CREATE)
💡 WHY: You already have the base - we enhance and animate it
🎯 REFINE POWER: GPT-Image-1 excels at photo enhancement and quality improvement

For original creations (avatars, logos, etc.), CREATE first captures artistic uniqueness."

TONE & STYLE:
- Warm but professional
- Excited about possibilities
- Educational without being preachy
- Confident in recommendations
- Patient with questions
- Zero jargon unless explaining

IMPORTANT CONTEXT EXTRACTION:
Pay attention to clues in conversation and remember:
- Content type (avatar, logo, ad, etc.)
- Style preferences (modern, vintage, minimalist, etc.)
- Intended use (social media, website, print, etc.)
- Target audience (B2B, consumers, specific demographic)
- Brand personality (playful, serious, innovative, etc.)

Your goal: Make them feel like a creative genius while subtly guiding them to professional results.`;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages, context } = await request.json();

		// Build context-aware system prompt
		const contextPrompt = context
			? `

CURRENT SESSION CONTEXT:
- Content Type: ${context.contentType || 'Not yet determined'}
- User Intent: ${context.userIntent || 'Exploring'}
- Style Preference: ${context.style || 'Not specified'}
- Purpose: ${context.purpose || 'Not specified'}
- Target Audience: ${context.targetAudience || 'Not specified'}

Use this context to provide more relevant, personalized guidance. If user asks vague questions, gently extract these details.`
			: '';

		// Call Anthropic API
		const response = await anthropic.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 2000,
			temperature: 0.7, // Slightly creative but consistent
			system: SYSTEM_PROMPT + contextPrompt,
			messages: messages.map((msg: any) => ({
				role: msg.role,
				content: msg.content
			}))
		});

		const assistantMessage = response.content[0];
		const text = assistantMessage.type === 'text' ? assistantMessage.text : '';

		// Extract context from AI response
		const extractedContext = extractContextFromResponse(text, context);

		// Detect if prompts were generated (can be multiple)
		const promptsInfo = extractPromptsFromMessage(text);
		
		// Extract pro tip data point
		const proTip = extractProTip(text);

		return json({
			message: text,
			context: extractedContext,
			prompts: promptsInfo,
			proTip: proTip,
			usage: response.usage
		});
	} catch (error) {
		console.error('Prompt Coach API Error:', error);
		return json(
			{
				error: 'Failed to get response from Prompt Coach',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// Helper: Extract context clues from AI response
function extractContextFromResponse(text: string, currentContext: any) {
	const updates: any = { ...currentContext };
	const lowerText = text.toLowerCase();

	// Detect content type
	const contentTypes = {
		avatar: ['avatar', 'profile picture', 'headshot', 'portrait'],
		logo: ['logo', 'brand mark', 'symbol', 'icon'],
		ad: ['ad', 'advertisement', 'commercial', 'promo'],
		'social-post': ['social post', 'instagram', 'facebook', 'twitter', 'social media'],
		banner: ['banner', 'header', 'hero image'],
		flyer: ['flyer', 'poster', 'handout'],
		product: ['product', 'product shot', 'e-commerce']
	};

	for (const [type, keywords] of Object.entries(contentTypes)) {
		if (keywords.some((kw) => lowerText.includes(kw))) {
			updates.contentType = type;
			break;
		}
	}

	// Detect style preferences
	const styles = [
		'artistic',
		'photorealistic',
		'professional',
		'fun',
		'playful',
		'elegant',
		'minimalist',
		'bold',
		'surreal',
		'impressionist',
		'cyberpunk',
		'vintage',
		'modern',
		'contemporary',
		'abstract'
	];

	for (const style of styles) {
		if (lowerText.includes(style)) {
			updates.style = style;
			break;
		}
	}

	// Detect intent keywords
	const intents = ['professional', 'artistic', 'commercial', 'personal', 'business'];
	for (const intent of intents) {
		if (lowerText.includes(intent)) {
			updates.userIntent = intent;
			break;
		}
	}

	return updates;
}

// Helper: Extract multiple prompts if generated (numbered list format)
function extractPromptsFromMessage(text: string): Array<{text: string; quality: 'draft' | 'good' | 'excellent'}> {
	const prompts: Array<{text: string; quality: 'draft' | 'good' | 'excellent'}> = [];
	
	// Look for numbered prompts (1. , 2. , 3. etc)
	const numberedPattern = /^\d+\.\s+(.+?)(?=\n\d+\.|$)/gms;
	const matches = text.matchAll(numberedPattern);
	
	for (const match of matches) {
		if (match[1]) {
			const promptText = match[1].trim();
			// Skip if it's too short (probably not a prompt)
			if (promptText.length > 30) {
				prompts.push({
					text: promptText,
					quality: assessPromptQuality(promptText)
				});
			}
		}
	}
	
	// If we found prompts, return them
	if (prompts.length > 0) {
		return prompts;
	}
	
	// Fallback: Look for single prompt with quotes
	const singlePromptPatterns = [
		/here's your (?:optimized )?prompt:?\s*['"']([^'"']+)['"']/i,
		/try this prompt:?\s*['"']([^'"']+)['"']/i,
		/(?:prompt|use):\s*['"']([^'"']+)['"']/i
	];

	for (const pattern of singlePromptPatterns) {
		const match = text.match(pattern);
		if (match && match[1]) {
			return [{
				text: match[1].trim(),
				quality: assessPromptQuality(match[1])
			}];
		}
	}

	return [];
}

// Helper: Extract pro tip data point (can be multi-line)
function extractProTip(text: string): string | null {
	// Look for PRO TIP section - capture everything until next major section or end
	// Pattern: PRO TIP: [content] (stops at double newline or end of message)
	const proTipPattern = /💡\s*PRO TIP:?\s*([\s\S]+?)(?=\n\n[A-Z]|$)/i;
	const match = text.match(proTipPattern);
	
	if (match && match[1]) {
		return match[1].trim();
	}
	
	// Fallback: Look for the entire section after "PRO TIP:" until message ends
	const simplePattern = /PRO TIP:?\s*([\s\S]+)/i;
	const simpleMatch = text.match(simplePattern);
	
	if (simpleMatch && simpleMatch[1]) {
		// Clean up - remove any trailing quotes or markdown
		let tip = simpleMatch[1].trim();
		// Remove trailing quotes if present
		tip = tip.replace(/["']$/, '');
		return tip;
	}
	
	return null;
}

// Helper: Assess prompt quality
function assessPromptQuality(prompt: string): 'draft' | 'good' | 'excellent' {
	const wordCount = prompt.split(/\s+/).length;
	const hasStyleRef = /\b(impressionist|surreal|cyberpunk|art deco|contemporary)\b/i.test(
		prompt
	);
	const hasLighting = /\b(lighting|shadows|golden hour|studio)\b/i.test(prompt);
	const hasComposition = /\b(centered|rule of thirds|dynamic|angle)\b/i.test(prompt);

	let score = 0;
	if (wordCount >= 15) score++;
	if (wordCount >= 25) score++;
	if (hasStyleRef) score++;
	if (hasLighting) score++;
	if (hasComposition) score++;

	if (score >= 4) return 'excellent';
	if (score >= 2) return 'good';
	return 'draft';
}