// Next.js route handler: AI-mode HTML -> GenerateBlocks conversion.
// The user's Anthropic API key is taken per-request and never stored.
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";

const SYSTEM = `You convert HTML/CSS into GenerateBlocks V2 block markup for WordPress.
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

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { html, prefix, apiKey } = body || {};
  if (!html || !apiKey) {
    return Response.json({ error: "Missing html or apiKey" }, { status: 400 });
  }
  if (!/^sk-ant-/.test(apiKey)) {
    return Response.json(
      { error: "That doesn't look like an Anthropic API key (sk-ant-...)." },
      { status: 400 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Section prefix: "${prefix || "sec"}".\n\nConvert this HTML to GenerateBlocks V2 markup:\n\n${html}`,
        },
      ],
    });
    const output = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return Response.json({ output });
  } catch (e) {
    const status = e?.status || 500;
    const message = status === 401 ? "Invalid API key." : e?.message || "Conversion failed.";
    return Response.json({ error: message }, { status });
  }
}
