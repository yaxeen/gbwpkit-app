"use client";

import { useState } from "react";
import { convert } from "../lib/converter";
import "./globals.css";

const SAMPLE = `<section style="padding:60px 20px;background:#f5f5f3;text-align:center">
  <h2 style="font-size:35px;color:#0a0a0a">Build faster with GenerateBlocks</h2>
  <p style="color:#5c5c5c">Paste your HTML and get clean blocks instantly.</p>
  <a href="/get-started/" style="background:#c0392b;color:#fff;padding:15px 30px;border-radius:2rem">Get started</a>
</section>`;

export default function Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [prefix, setPrefix] = useState("sec");
  const [mode, setMode] = useState("rules");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState({ msg: "", kind: "" });
  const [busy, setBusy] = useState(false);

  const setMsg = (msg, kind = "") => setStatus({ msg, kind });

  async function handleConvert() {
    const html = input.trim();
    if (!html) return setMsg("Paste some HTML first.", "err");
    setOutput("");

    if (mode === "ai") {
      if (!apiKey.trim()) return setMsg("AI mode needs your Anthropic API key.", "err");
      setBusy(true);
      setMsg("Converting with Claude Sonnet…");
      try {
        const res = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, prefix, apiKey: apiKey.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI request failed");
        setOutput(data.output);
        setMsg("Done (AI mode) ✓", "ok");
      } catch (e) {
        setMsg("AI error: " + e.message, "err");
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      const result = convert(html, prefix);
      if (!result.ok) return setMsg(result.error, "err");
      setOutput(result.output);
      setMsg(`Done ✓ ${result.count} blocks. Paste into WP Code Editor.`, "ok");
    } catch (e) {
      setMsg("Convert error: " + e.message, "err");
    }
  }

  async function copyOut() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setMsg("Copied to clipboard ✓", "ok");
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          🧱 <strong>GBWPKit</strong> <span>HTML → GenerateBlocks</span>
        </div>
        <a className="ghlink" href="https://github.com/yaxeen/gbwpkit" target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
      </header>

      <main>
        <p className="lead">
          Paste any HTML and get clean <strong>GenerateBlocks V2</strong> block markup for the
          WordPress Code Editor. Rule-based mode runs entirely in your browser — your HTML never
          leaves the page.
        </p>

        <div className="controls">
          <label>
            Section prefix
            <input
              className="prefix-in"
              type="text"
              value={prefix}
              maxLength={4}
              placeholder="hero"
              onChange={(e) => setPrefix(e.target.value)}
            />
          </label>

          <label>
            Engine
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="rules">Rule-based (free, private)</option>
              <option value="ai">AI mode (Claude Sonnet — needs API key)</option>
            </select>
          </label>

          {mode === "ai" && (
            <div className="ai-key">
              <label>
                Anthropic API key
                <input
                  className="key-in"
                  type="password"
                  value={apiKey}
                  placeholder="sk-ant-..."
                  autoComplete="off"
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </label>
              <small>Used only for this request. Never stored.</small>
            </div>
          )}
        </div>

        <div className="panes">
          <section className="pane">
            <div className="pane-head">
              <span>HTML input</span>
              <button className="ghost" onClick={() => { setInput(SAMPLE); setMsg("Sample loaded. Hit Convert."); }}>
                Load sample
              </button>
            </div>
            <textarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"<section>\n  <h2>Hello</h2>\n  <p>Paste your HTML here…</p>\n</section>"}
            />
          </section>

          <section className="pane">
            <div className="pane-head">
              <span>GenerateBlocks output</span>
              <button className="ghost" onClick={copyOut} disabled={!output}>
                Copy
              </button>
            </div>
            <textarea
              spellCheck={false}
              readOnly
              value={output}
              placeholder="Your GenerateBlocks code appears here…"
            />
          </section>
        </div>

        <div className="actions">
          <button className="primary" onClick={handleConvert} disabled={busy}>
            {busy ? "Converting…" : "Convert →"}
          </button>
          <span className={"status " + status.kind}>{status.msg}</span>
        </div>

        <details className="help">
          <summary>How to use the output in WordPress</summary>
          <ol>
            <li>Copy the GenerateBlocks code above.</li>
            <li>In WordPress, open your page/post.</li>
            <li>Top-right <strong>⋮ menu → Code Editor</strong>.</li>
            <li>Paste, then switch back to <strong>Visual Editor</strong>.</li>
            <li>Replace any placeholder images with your own.</li>
          </ol>
        </details>
      </main>

      <footer>
        <span>GBWPKit · MIT · not affiliated with GenerateBlocks</span>
      </footer>
    </>
  );
}
