<div align="center">

# 🧱 GBWPKit App

### Paste HTML → get clean **GenerateBlocks V2** blocks

[![Next.js](https://img.shields.io/badge/Next.js-14-000000.svg?logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-000000.svg?logo=vercel)](https://vercel.com)

</div>

A web app that converts any HTML into GenerateBlocks V2 block markup for the
WordPress Code Editor.

- **Rule-based mode (default)** — pure client-side conversion. Free, instant, and
  your HTML never leaves the browser.
- **AI mode (optional)** — paste your own Anthropic API key and Claude **Sonnet**
  handles complex layouts. The key is used per-request and never stored.

Companion to the [GBWPKit skill + validator](https://github.com/yaxeen/gbwpkit).

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

```bash
npm i -g vercel
vercel           # preview
vercel --prod    # production
```

No environment variables are required — AI mode uses the key the user types in
the UI, so nothing secret is stored server-side.

## Project structure

```
gbwpkit-app/
├── app/
│   ├── page.js              # the converter UI (client component)
│   ├── layout.js
│   ├── globals.css
│   └── api/convert/route.js # AI mode (Claude Sonnet) — key per request
├── lib/converter.js         # rule-based HTML -> GB engine (browser)
├── next.config.js
└── package.json
```

## How the output works in WordPress

1. Copy the generated GenerateBlocks code.
2. Open your page/post → top-right **⋮ → Code Editor**.
3. Paste → switch back to **Visual Editor**.
4. Replace any placeholder images.

## License

MIT — Muhammad Yasin. Not affiliated with or endorsed by GenerateBlocks.
