/*
 * AI provider + model catalog, shared by the UI (model picker) and the
 * /api/convert route (dispatch). Each provider uses the user's own API key,
 * passed per-request and never stored.
 */

export const PROVIDERS = {
  anthropic: {
    label: "Anthropic (Claude)",
    keyPrefix: "sk-ant-",
    keyHint: "sk-ant-...",
    docs: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (recommended)" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8 (highest quality)" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (fastest/cheapest)" },
    ],
  },
  openai: {
    label: "OpenAI (GPT)",
    keyPrefix: "sk-",
    keyHint: "sk-...",
    docs: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-4o", label: "GPT-4o (recommended)" },
      { id: "gpt-4o-mini", label: "GPT-4o mini (fast/cheap)" },
      { id: "gpt-4.1", label: "GPT-4.1" },
    ],
  },
  google: {
    label: "Google (Gemini)",
    keyPrefix: "AIza",
    keyHint: "AIza...",
    docs: "https://aistudio.google.com/app/apikey",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (recommended)" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (highest quality)" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (fast/cheap)" },
    ],
  },
};

export const DEFAULT_PROVIDER = "anthropic";

export const SYSTEM_PROMPT = `You convert HTML/CSS into GenerateBlocks V2 block markup for WordPress.
Output ONLY the block markup — no explanation, no markdown fences.

Blocks and their rendered class pattern:
- generateblocks/element  -> gb-element-{id} gb-element   (div, section, article, header, footer, nav, main, figure, a, ul, ol, li)
- generateblocks/text     -> gb-text-{id} gb-text         (p, span, h1-h6, a, button, figcaption, li)
- generateblocks/media    -> gb-media-{id} gb-media       (img only)
- generateblocks/shape    -> gb-shape-{id} gb-shape       (inline SVG)

Rules that matter:
1. Every block needs a unique uniqueId: {prefix}{number}{letter?}, e.g. hero001, card014a. One prefix per section.
2. Rendered body element class MUST be "gb-{kind}-{id} gb-{kind}".
3. In the JSON delimiter, className is typically just "gb-{kind}" and is the LAST key.
4. htmlAttributes is a PLAIN OBJECT, never an array: {"href":"https://...","target":"_blank"}. Use absolute or root-relative URLs.
5. Never leave a raw "--" inside the JSON delimiter — escape each as \\u002d\\u002d. Raw & < > inside values (image URLs) are fine.
6. Links: an element with tagName "a" wrapping a text child (span). A text block with tagName "a" drops its href on save.
7. styles is a camelCased object (paddingTop, backgroundColor, &:hover, @media keys). css is the single-line compiled string scoped to .gb-{kind}-{id}; it MAY contain :hover and transition.
8. Block delimiter format:
<!-- wp:generateblocks/element {"uniqueId":"hero001","tagName":"section","styles":{...},"css":".gb-element-hero001{...}","className":"gb-element"} -->
<section class="gb-element-hero001 gb-element">...children...</section>
<!-- /wp:generateblocks/element -->

Dynamic tags use {{tag option:value}} grammar (no quotes). These do NOT exist: post_url, featured_image_url, acf, post_terms.

Convert the user's HTML faithfully: preserve structure, move inline styles into styles+css, flatten redundant wrapper divs, use placeholder images where none exist.`;

export function userPrompt(html, prefix) {
  return `Section prefix: "${prefix || "sec"}".\n\nConvert this HTML to GenerateBlocks V2 markup:\n\n${html}`;
}
