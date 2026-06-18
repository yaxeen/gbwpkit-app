<div align="center">

# 🧱 GBWPKit App

### Paste HTML → get clean **GenerateBlocks V2** blocks

[![Next.js](https://img.shields.io/badge/Next.js-14-000000.svg?logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-000000.svg?logo=vercel)](https://vercel.com)
![Validation](https://img.shields.io/badge/live-validation-c0392b.svg)

</div>

A web app that converts any HTML into GenerateBlocks V2 block markup for the
WordPress Code Editor — and checks the output against the recovery-error rules
**before** you paste it in.

Companion to the [GBWPKit skill + validator](https://github.com/yaxeen/gbwpkit).

## Features

- **Rule-based engine (default)** — pure client-side conversion. Free, instant,
  and your HTML never leaves the browser.
- **AI mode (optional, multi-provider)** — bring your own API key:
  - **Anthropic** — Claude Sonnet 4.6 / Opus 4.8 / Haiku 4.5
  - **OpenAI** — GPT-4o / GPT-4o mini / GPT-4.1
  - **Google** — Gemini 2.0 Flash / 1.5 Pro / 1.5 Flash

  The key is used per-request and never stored.
- **Live validation badge** — every result is checked client-side against the
  GBWPKit rules: `✓ N blocks · no issues`, or it flags recovery / silent
  (invalid dynamic tag) problems.
- **Block-stack view** — output shown as labeled "brick" cards (delimiter +
  block kind + uniqueId), or flip to **Raw** for plain markup.
- **Block summary chips** — `element 1 · text 3 · media 1`.
- **Light / dark theme** — warm clay "block foundry" palette, remembers your
  choice, respects system preference.
- **Copy or Download** — grab the markup or save it as `{prefix}.html`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Deploy to Vercel

Already wired to GitHub — every push to `main` auto-deploys. Manual deploy:

```bash
npm i -g vercel
vercel --prod
```

No environment variables are needed. AI mode uses the key the user types in the
UI, so nothing secret is stored server-side.

## Project structure

```
gbwpkit-app/
├── app/
│   ├── page.js              # converter UI (client): theme, model picker,
│   │                        #   validation badge, block-stack, download
│   ├── layout.js
│   ├── globals.css          # "block foundry" theme (light + dark)
│   └── api/convert/route.js # AI mode — dispatches to the chosen provider
├── lib/
│   ├── converter.js         # rule-based HTML -> GB engine (browser)
│   ├── validate.js          # client-side validator + block parser
│   └── providers.js         # provider/model catalog + shared system prompt
└── package.json
```

## How the output works in WordPress

1. Copy the GenerateBlocks code (or **Download** the `.html`).
2. Open your page/post → top-right **⋮ → Code Editor**.
3. Paste → switch back to **Visual Editor**.
4. Replace any placeholder images.

## Adding more models

Edit `lib/providers.js` — add a model id to a provider's `models` array, or add
a whole new provider entry, then wire its SDK call in `app/api/convert/route.js`.

## License

MIT — Muhammad Yasin. Not affiliated with or endorsed by GenerateBlocks.
