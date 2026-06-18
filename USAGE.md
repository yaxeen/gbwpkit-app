# GBWPKit App — How to Use

Live app: **https://gbwpkit-app.vercel.app**

Paste HTML, get clean GenerateBlocks V2 blocks for WordPress. Two engines: a free
rule-based one that runs in your browser, and an optional AI mode using your own
API key.

---

## 1. Quick start (rule-based, free)

1. Open the app.
2. (Optional) Set a **Section prefix** — e.g. `hero`. Block ids become `hero001`,
   `hero002`, … Keeps each section's ids tidy.
3. Paste your HTML in the left box (or click **Load sample**).
4. Click **Convert →**.
5. Check the green badge: `✓ N blocks · no issues`.
6. Click **Copy** (or **Download** the `.html`).
7. Paste into WordPress (see below).

Your HTML never leaves the browser in this mode.

---

## 2. AI mode (better for complex layouts)

Use this when the HTML is messy (Framer/Webflow exports) or deeply nested.

1. Set **Engine → AI mode (your API key)**.
2. Pick a **Provider** and **Model**:
   - **Anthropic** — Claude Sonnet 4.6 (recommended), Opus 4.8 (best), Haiku 4.5 (cheap)
   - **OpenAI** — GPT-4o (recommended), GPT-4o mini, GPT-4.1
   - **Google** — Gemini 2.0 Flash (recommended), 1.5 Pro, 1.5 Flash
3. Paste your **API key** for that provider (use the *get a key ↗* link if you
   need one). The key is used only for this request and is never stored.
4. Click **Convert →**.

> Cost note: AI mode bills your own provider account per conversion. Rule-based
> mode is free.

---

## 3. Reading the output

- **Badge** — `✓ N blocks · no issues` means the output passes the recovery-error
  rules. If it shows issues, scroll down to the list:
  - **RECOVERY** — would break the block in the WordPress editor. Fix before pasting.
  - **SILENT** — saves fine but renders wrong (e.g. a non-existent dynamic tag).
- **Summary chips** — how many of each block kind: `element · text · media · shape`.
- **Blocks view** — each block as a labeled card (delimiter + kind + id).
- **Raw view** — plain markup, easiest to copy by hand.

---

## 4. Paste into WordPress

1. Open your page/post in the block editor.
2. Top-right **⋮ menu → Code Editor**.
3. Paste the GenerateBlocks code.
4. Top-right **⋮ menu → Visual Editor** to switch back — the section appears.
5. Replace any placeholder images with your own.

---

## 5. Theme

Top-right **☀ / ☾** toggles light and dark. Your choice is remembered, and the
app follows your system preference the first time.

---

## Tips

- **Paste a full element** (a `<section>` or `<div>`), not a fragment — the
  converter needs a root to walk.
- **Exact colors/fonts from screenshots or odd CSS are approximate** — verify
  after building.
- Rule-based mode is great for clean HTML; switch to AI mode when structure is
  tangled.
