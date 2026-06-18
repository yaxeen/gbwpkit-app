/*
 * Client-side GBWPKit validator + block parser.
 * A JS port of the rules in gbwpkit.py, used for the live validation badge,
 * the block-stack view, and the type summary. Runs in the browser.
 */

const TAGS = {
  valid: new Set([
    "post_title", "post_excerpt", "post_permalink", "post_date", "featured_image",
    "post_meta", "author_meta", "comments_count", "comments_url", "author_archives_url",
    "author_avatar_url", "term_list", "previous_posts_page_url", "next_posts_page_url", "media",
    "archive_title", "archive_description", "current_year", "loop_index", "loop_item",
    "option", "site_logo_url", "site_tagline", "site_title", "site_url", "tag_name",
    "term_meta", "user_meta",
  ]),
  invalid: new Set(["post_url", "featured_image_url", "acf", "post_terms"]),
};

const KIND_RE = /gb-(element|text|media|shape|query|looper|loop-item)\b/g;
const OPEN_RE = /<!--\s*wp:(generateblocks\/[a-z0-9-]+|[a-z0-9-]+\/[a-z0-9-]+)\s*(\{[\s\S]*?\})?\s*(\/)?-->/g;
const TAG_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)([^}]*)\}\}/g;

function lineOf(text, idx) {
  let line = 1;
  for (let i = 0; i < idx && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

// Parse the document into block descriptors.
export function parseBlocks(text) {
  const blocks = [];
  let m;
  OPEN_RE.lastIndex = 0;
  while ((m = OPEN_RE.exec(text)) !== null) {
    const name = m[1];
    const attrsRaw = m[2] || "";
    let attrs = null, parseError = null;
    if (attrsRaw) {
      try { attrs = JSON.parse(attrsRaw); }
      catch (e) { parseError = e.message; }
    }
    blocks.push({
      name,
      kind: name.startsWith("generateblocks/") ? name.split("/")[1] : null,
      attrsRaw,
      attrs,
      parseError,
      line: lineOf(text, m.index),
      isGB: name.startsWith("generateblocks/"),
    });
  }
  return blocks;
}

// Return { findings:[{severity,rule,fix,line,name}], summary:{element:1,...}, counts }
export function validate(text) {
  const blocks = parseBlocks(text);
  const findings = [];
  const summary = {};

  for (const b of blocks) {
    if (b.isGB && b.kind) summary[b.kind] = (summary[b.kind] || 0) + 1;
    if (!b.isGB) continue;

    if (b.parseError) {
      findings.push({ severity: "RECOVERY", rule: `attribute JSON does not parse: ${b.parseError}`, fix: "fix the JSON in the block delimiter", line: b.line, name: b.name });
      continue;
    }
    const a = b.attrs;
    if (!a || typeof a !== "object") continue;

    // array htmlAttributes
    for (const key of ["htmlAttributes", "linkHtmlAttributes"]) {
      if (Array.isArray(a[key])) {
        findings.push({ severity: "RECOVERY", rule: `${key} is an array — must be a plain object`, fix: 'use {"href":"..."} not [{"attribute":...}]', line: b.line, name: b.name });
      }
    }
    // raw -- in attrs
    const stripped = b.attrsRaw.replaceAll("\\u002d", "");
    if (stripped.includes("--")) {
      findings.push({ severity: "RECOVERY", rule: "raw '--' in attribute JSON (can form '-->')", fix: "escape each -- to \\u002d\\u002d", line: b.line, name: b.name });
    }
    // className references different kind
    const cls = typeof a.className === "string" ? a.className : "";
    if (cls) {
      const kinds = [...cls.matchAll(KIND_RE)].map((x) => x[1]);
      const wrong = kinds.find((k) => k !== b.kind);
      if (wrong) {
        findings.push({ severity: "RECOVERY", rule: `className references a different block kind (${wrong}) than this ${b.kind} block`, fix: `use gb-${b.kind}`, line: b.line, name: b.name });
      }
    }
  }

  // dynamic tags (whole document)
  let t;
  TAG_RE.lastIndex = 0;
  while ((t = TAG_RE.exec(text)) !== null) {
    const name = t[1], rest = t[2], whole = t[0];
    if (TAGS.invalid.has(name)) {
      findings.push({ severity: "SILENT", rule: `${whole} does not exist — renders as literal text`, fix: "use a real tag (post_permalink, featured_image, post_meta, term_list)", line: lineOf(text, t.index), name: "dynamic-tag" });
    } else if (!TAGS.valid.has(name)) {
      findings.push({ severity: "SILENT", rule: `{{${name}}} is not a known GenerateBlocks tag`, fix: "verify the tag name", line: lineOf(text, t.index), name: "dynamic-tag" });
    } else if (rest.trim()) {
      if (rest.includes("=")) findings.push({ severity: "SILENT", rule: `${whole} uses '=' — options use ':'`, fix: "key:value", line: lineOf(text, t.index), name: "dynamic-tag" });
      if (/["']/.test(rest)) findings.push({ severity: "SILENT", rule: `${whole} has quotes — options are never quoted`, fix: "remove quotes", line: lineOf(text, t.index), name: "dynamic-tag" });
    }
  }

  const recovery = findings.filter((f) => f.severity === "RECOVERY").length;
  const silent = findings.filter((f) => f.severity === "SILENT").length;
  return { blocks, findings, summary, counts: { recovery, silent, total: blocks.filter((b) => b.isGB).length } };
}

// Split the document into top-level block strings for the block-stack view.
export function splitTopLevelBlocks(text) {
  const lines = text.split("\n");
  const out = [];
  let depth = 0, current = [], currentName = null;
  for (const line of lines) {
    const open = line.match(/<!--\s*wp:([a-z0-9-]+\/[a-z0-9-]+)(\s+\{[\s\S]*?\})?\s*(\/)?-->/);
    const close = line.match(/<!--\s*\/wp:[a-z0-9-]+\/[a-z0-9-]+\s*-->/);
    const selfClose = open && open[3] === "/";

    if (open && depth === 0) {
      currentName = open[1];
      current = [line];
      if (selfClose) { out.push({ name: currentName, code: current.join("\n") }); current = []; currentName = null; }
      else depth = 1;
      continue;
    }
    if (depth > 0) {
      current.push(line);
      if (open && !selfClose) depth++;
      else if (close) {
        depth--;
        if (depth === 0) { out.push({ name: currentName, code: current.join("\n") }); current = []; currentName = null; }
      }
    }
  }
  if (current.length && currentName) out.push({ name: currentName, code: current.join("\n") });
  return out;
}
