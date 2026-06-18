"use client";

import { useEffect, useMemo, useState } from "react";
import { convert } from "../lib/converter";
import { validate, splitTopLevelBlocks } from "../lib/validate";
import { PROVIDERS, DEFAULT_PROVIDER } from "../lib/providers";
import "./globals.css";

const SAMPLE = `<section style="padding:60px 20px;background:#f5f5f3;text-align:center">
  <h2 style="font-size:35px;color:#0a0a0a">Build faster with GenerateBlocks</h2>
  <p style="color:#5c5c5c">Paste your HTML and get clean blocks instantly.</p>
  <a href="/get-started/" style="background:#c0392b;color:#fff;padding:15px 30px;border-radius:2rem">Get started</a>
</section>`;

const KIND_COLOR = {
  element: "var(--k-element)", text: "var(--k-text)", media: "var(--k-media)",
  shape: "var(--k-shape)", query: "var(--k-query)", looper: "var(--k-query)", "loop-item": "var(--k-query)",
};

function useTheme() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const saved = localStorage.getItem("gbwpkit-theme");
    const initial = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(initial);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gbwpkit-theme", theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

function uidOf(code) {
  const m = code.match(/"uniqueId":"([^"]+)"/);
  return m ? m[1] : "";
}

export default function Page() {
  const [theme, toggleTheme] = useTheme();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [prefix, setPrefix] = useState("sec");
  const [mode, setMode] = useState("rules");
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);
  const [model, setModel] = useState(PROVIDERS[DEFAULT_PROVIDER].models[0].id);
  const [apiKey, setApiKey] = useState("");
  const [view, setView] = useState("blocks");
  const [status, setStatus] = useState({ msg: "", kind: "" });
  const [busy, setBusy] = useState(false);

  const setMsg = (msg, kind = "") => setStatus({ msg, kind });

  const report = useMemo(() => (output ? validate(output) : null), [output]);
  const bricks = useMemo(() => (output ? splitTopLevelBlocks(output) : []), [output]);

  function onProvider(p) {
    setProvider(p);
    setModel(PROVIDERS[p].models[0].id);
  }

  async function handleConvert() {
    const html = input.trim();
    if (!html) return setMsg("Paste some HTML first.", "err");
    setOutput("");

    if (mode === "ai") {
      const p = PROVIDERS[provider];
      if (!apiKey.trim()) return setMsg(`AI mode needs your ${p.label} key.`, "err");
      setBusy(true);
      setMsg(`Converting with ${model}…`);
      try {
        const res = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, prefix, apiKey: apiKey.trim(), provider, model }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI request failed");
        setOutput(data.output);
        setMsg("Done (AI mode) ✓", "ok");
      } catch (e) {
        setMsg("AI error: " + e.message, "err");
      } finally { setBusy(false); }
      return;
    }

    try {
      const result = convert(html, prefix);
      if (!result.ok) return setMsg(result.error, "err");
      setOutput(result.output);
      setMsg(`Converted ✓`, "ok");
    } catch (e) { setMsg("Convert error: " + e.message, "err"); }
  }

  async function copyOut() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setMsg("Copied to clipboard ✓", "ok");
  }
  function downloadOut() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${prefix || "section"}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("Downloaded ✓", "ok");
  }

  const clean = report && report.counts.recovery === 0 && report.counts.silent === 0;

  return (
    <>
      <header className="topbar">
        <div className="brand">
          🧱 <b>gbwpkit</b><span className="accent">/</span><span className="sub">html → generateblocks</span>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <a className="ghlink" href="https://github.com/yaxeen/gbwpkit-app" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
      </header>

      <main>
        <p className="lead">
          Paste any HTML — get clean <span className="pin">GenerateBlocks V2</span> blocks, checked
          live against the recovery-error rules before you paste them into WordPress. Rule-based mode
          runs in your browser; your HTML never leaves the page.
        </p>

        <div className="controls">
          <label className="field">
            <span>Section prefix</span>
            <input className="prefix-in" value={prefix} maxLength={4} placeholder="hero" onChange={(e) => setPrefix(e.target.value)} />
          </label>
          <label className="field">
            <span>Engine</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="rules">Rule-based (free, private)</option>
              <option value="ai">AI mode (your API key)</option>
            </select>
          </label>

          {mode === "ai" && (
            <>
              <label className="field">
                <span>Provider</span>
                <select value={provider} onChange={(e) => onProvider(e.target.value)}>
                  {Object.entries(PROVIDERS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Model</span>
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  {PROVIDERS[provider].models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>API key <span className="hint">· never stored</span></span>
                <input className="key-in" type="password" value={apiKey} placeholder={PROVIDERS[provider].keyHint} autoComplete="off" onChange={(e) => setApiKey(e.target.value)} />
                <a className="docs" href={PROVIDERS[provider].docs} target="_blank" rel="noopener noreferrer">get a key ↗</a>
              </label>
            </>
          )}
        </div>

        <div className="panes">
          <section className="pane">
            <div className="pane-head">
              <div className="left"><span>HTML input</span></div>
              <button className="ghost" onClick={() => { setInput(SAMPLE); setMsg("Sample loaded — hit Convert."); }}>Load sample</button>
            </div>
            <textarea spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={"<section>\n  <h2>Hello</h2>\n  <p>Paste your HTML here…</p>\n</section>"} />
          </section>

          <section className="pane outwrap">
            <div className="pane-head">
              <div className="left">
                <span>Output</span>
                <div className="seg">
                  <button className={view === "blocks" ? "on" : ""} onClick={() => setView("blocks")}>Blocks</button>
                  <button className={view === "raw" ? "on" : ""} onClick={() => setView("raw")}>Raw</button>
                </div>
              </div>
              <div className="left">
                <button className="ghost" onClick={copyOut} disabled={!output}>Copy</button>
                <button className="ghost" onClick={downloadOut} disabled={!output}>Download</button>
              </div>
            </div>

            {report && (
              <div className="statusbar">
                <span className={"badge " + (clean ? "ok" : "warn")}>
                  {clean ? "✓" : "!"} {report.counts.total} blocks · {clean ? "no issues" : `${report.counts.recovery + report.counts.silent} issue(s)`}
                </span>
                {Object.entries(report.summary).map(([k, n]) => (
                  <span key={k} className="chip"><span className="dot" style={{ background: KIND_COLOR[k] || "var(--text-3)" }} />{k} {n}</span>
                ))}
              </div>
            )}

            {view === "raw" ? (
              <textarea spellCheck={false} readOnly value={output} placeholder="Your GenerateBlocks code appears here…" />
            ) : (
              <div className="stack">
                {bricks.length === 0 && <div className="empty">Your GenerateBlocks blocks appear here, stacked and labeled.</div>}
                {bricks.map((b, i) => {
                  const kind = b.name.startsWith("generateblocks/") ? b.name.split("/")[1] : null;
                  return (
                    <div className="brick" key={i}>
                      <div className="brick-head">
                        <span className="dot" style={{ background: KIND_COLOR[kind] || "var(--text-3)" }} />
                        <span className="brick-name">{b.name}</span>
                        <span className="brick-uid">{uidOf(b.code)}</span>
                      </div>
                      <pre>{b.code}</pre>
                    </div>
                  );
                })}
              </div>
            )}

            {report && report.findings.length > 0 && (
              <div className="issues">
                {report.findings.slice(0, 8).map((f, i) => (
                  <div className="issue" key={i}><span className={"sev " + f.severity}>{f.severity}</span><span>{f.rule}</span></div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="actions">
          <button className="primary" onClick={handleConvert} disabled={busy}>{busy ? "Converting…" : "Convert →"}</button>
          <span className={"status " + status.kind}>{status.msg}</span>
        </div>

        <details className="help">
          <summary>How to use the output in WordPress</summary>
          <ol>
            <li>Copy the GenerateBlocks code (or Download the .html).</li>
            <li>In WordPress, open your page/post.</li>
            <li>Top-right <strong>⋮ menu → Code Editor</strong>.</li>
            <li>Paste, then switch back to <strong>Visual Editor</strong>.</li>
            <li>Replace any placeholder images with your own.</li>
          </ol>
        </details>
      </main>

      <footer>GBWPKit · MIT · not affiliated with GenerateBlocks</footer>
    </>
  );
}
