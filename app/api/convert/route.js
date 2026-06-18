// Next.js route handler: AI-mode HTML -> GenerateBlocks conversion.
// Supports Anthropic, OpenAI and Google. The user's API key is taken
// per-request and never stored.
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROVIDERS, SYSTEM_PROMPT, userPrompt } from "../../../lib/providers";

export const runtime = "nodejs";
export const maxDuration = 30;

function badKey(provider, model) {
  const p = PROVIDERS[provider];
  if (!p) return `Unknown provider: ${provider}`;
  if (!p.models.some((m) => m.id === model)) return `Unknown model for ${provider}: ${model}`;
  return null;
}

async function runAnthropic(apiKey, model, html, prefix) {
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt(html, prefix) }],
  });
  return msg.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

async function runOpenAI(apiKey, model, html, prefix) {
  const client = new OpenAI({ apiKey });
  const res = await client.chat.completions.create({
    model,
    max_tokens: 8000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt(html, prefix) },
    ],
  });
  return (res.choices?.[0]?.message?.content || "").trim();
}

async function runGoogle(apiKey, model, html, prefix) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({ model, systemInstruction: SYSTEM_PROMPT });
  const res = await m.generateContent(userPrompt(html, prefix));
  return res.response.text().trim();
}

const RUNNERS = { anthropic: runAnthropic, openai: runOpenAI, google: runGoogle };

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const { html, prefix, apiKey, provider = "anthropic", model } = body || {};
  if (!html || !apiKey) {
    return Response.json({ error: "Missing html or apiKey" }, { status: 400 });
  }
  const p = PROVIDERS[provider];
  if (!p) return Response.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  if (!apiKey.startsWith(p.keyPrefix)) {
    return Response.json({ error: `That key doesn't look like a ${p.label} key (${p.keyHint}).` }, { status: 400 });
  }
  const err = badKey(provider, model);
  if (err) return Response.json({ error: err }, { status: 400 });

  try {
    const output = await RUNNERS[provider](apiKey, model, html, prefix);
    if (!output) return Response.json({ error: "Model returned an empty response." }, { status: 502 });
    return Response.json({ output });
  } catch (e) {
    const status = e?.status || e?.response?.status || 500;
    const message =
      status === 401 || status === 403
        ? "Invalid API key or no access to this model."
        : e?.message || "Conversion failed.";
    return Response.json({ error: message }, { status: typeof status === "number" ? status : 500 });
  }
}
