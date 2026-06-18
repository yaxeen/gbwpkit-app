/*
 * GBWPKit rule-based converter: HTML -> GenerateBlocks V2.
 * Pure function, runs in the browser (uses DOMParser). The pasted HTML
 * never leaves the page in rule-based mode.
 *
 * Output follows the GBWPKit rules: gb-{kind}-{id} gb-{kind} class,
 * htmlAttributes as a plain object, raw "--" escaped in JSON, className last.
 */

const ELEMENT_TAGS = new Set([
  "div", "section", "article", "header", "footer", "nav", "main",
  "aside", "figure", "ul", "ol", "li", "dl", "dt", "dd", "form",
]);
const TEXT_TAGS = new Set([
  "p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "a", "button",
  "figcaption", "label", "strong", "em", "blockquote", "small", "code",
]);

function camel(prop) {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function parseInlineStyle(styleStr) {
  const out = [];
  if (!styleStr) return out;
  styleStr.split(";").forEach((decl) => {
    const i = decl.indexOf(":");
    if (i === -1) return;
    const prop = decl.slice(0, i).trim().toLowerCase();
    const value = decl.slice(i + 1).trim();
    if (prop && value) out.push({ prop, value });
  });
  return out;
}

function buildStyles(decls, selector) {
  const styles = {};
  const cssParts = [];
  decls.forEach(({ prop, value }) => {
    styles[camel(prop)] = value;
    cssParts.push(`${prop}:${value}`);
  });
  const css = cssParts.length ? `.${selector}{${cssParts.join(";")}}` : "";
  return { styles, css };
}

function serializeAttrs(attrs) {
  // The only delimiter-dangerous sequence: escape every "--" inside the JSON.
  return JSON.stringify(attrs).replace(/--/g, "\\u002d\\u002d");
}

function htmlAttributes(el) {
  const obj = {};
  for (const attr of el.attributes) {
    const name = attr.name.toLowerCase();
    if (name === "style" || name === "class") continue;
    obj[name] = attr.value;
  }
  return obj;
}

function escapeText(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function indent(depth) {
  return "    ".repeat(depth);
}

function makeCounter() {
  let n = 0;
  return (prefix) => {
    n += 1;
    return prefix + String(n).padStart(3, "0");
  };
}

function buildText(el, prefix, depth, uid) {
  const id = uid(prefix);
  const tag = el.tagName.toLowerCase();
  const selector = `gb-text-${id}`;
  const { styles, css } = buildStyles(parseInlineStyle(el.getAttribute("style")), selector);
  const content = escapeText(el.textContent.trim());

  const attrs = { uniqueId: id, tagName: tag, content };
  if (Object.keys(styles).length) attrs.styles = styles;
  if (css) attrs.css = css;
  const ha = htmlAttributes(el);
  if (Object.keys(ha).length) attrs.htmlAttributes = ha;
  attrs.className = "gb-text";

  const pad = indent(depth);
  return (
    `${pad}<!-- wp:generateblocks/text ${serializeAttrs(attrs)} -->\n` +
    `${pad}<${tag} class="gb-text-${id} gb-text">${content}</${tag}>\n` +
    `${pad}<!-- /wp:generateblocks/text -->`
  );
}

function buildMedia(el, prefix, depth, uid) {
  const id = uid(prefix);
  const selector = `gb-media-${id}`;
  const { styles, css } = buildStyles(parseInlineStyle(el.getAttribute("style")), selector);
  const attrs = { uniqueId: id, tagName: "img" };
  if (Object.keys(styles).length) attrs.styles = styles;
  if (css) attrs.css = css;
  const ha = htmlAttributes(el);
  if (!ha.src) ha.src = el.getAttribute("src") || "https://placehold.co/800x600";
  if (ha.alt === undefined) ha.alt = el.getAttribute("alt") || "";
  attrs.htmlAttributes = ha;
  attrs.className = "gb-media";

  const pad = indent(depth);
  const attrStr = Object.entries(ha).map(([k, v]) => `${k}="${v}"`).join(" ");
  return (
    `${pad}<!-- wp:generateblocks/media ${serializeAttrs(attrs)} -->\n` +
    `${pad}<img class="gb-media-${id} gb-media" ${attrStr}/>\n` +
    `${pad}<!-- /wp:generateblocks/media -->`
  );
}

function buildShape(el, prefix, depth, uid) {
  const id = uid(prefix);
  const html = el.outerHTML;
  const attrs = { uniqueId: id, html, className: "gb-shape" };
  const pad = indent(depth);
  return (
    `${pad}<!-- wp:generateblocks/shape ${serializeAttrs(attrs)} -->\n` +
    `${pad}<span class="gb-shape-${id} gb-shape">${html}</span>\n` +
    `${pad}<!-- /wp:generateblocks/shape -->`
  );
}

function buildElement(el, prefix, depth, uid) {
  const id = uid(prefix);
  const tag = el.tagName.toLowerCase();
  const selector = `gb-element-${id}`;
  const { styles, css } = buildStyles(parseInlineStyle(el.getAttribute("style")), selector);

  const attrs = { uniqueId: id, tagName: tag };
  if (Object.keys(styles).length) attrs.styles = styles;
  if (css) attrs.css = css;
  const ha = htmlAttributes(el);
  if (Object.keys(ha).length) attrs.htmlAttributes = ha;
  attrs.className = "gb-element";

  const children = [];
  el.childNodes.forEach((node) => {
    const block = convertNode(node, prefix, depth + 1, uid);
    if (block) children.push(block);
  });

  const pad = indent(depth);
  const open = `${pad}<!-- wp:generateblocks/element ${serializeAttrs(attrs)} -->\n${pad}<${tag} class="gb-element-${id} gb-element">`;
  const close = `</${tag}>\n${pad}<!-- /wp:generateblocks/element -->`;
  if (children.length) {
    return `${open}\n${children.join("\n")}\n${pad}${close}`;
  }
  return `${open}${close}`;
}

function elementHasOnlyText(el) {
  for (const node of el.childNodes) {
    if (node.nodeType === 1) return false;
  }
  return el.textContent.trim().length > 0;
}

function convertNode(node, prefix, depth, uid) {
  if (node.nodeType !== 1) return null;
  const tag = node.tagName.toLowerCase();

  if (tag === "img") return buildMedia(node, prefix, depth, uid);
  if (tag === "svg") return buildShape(node, prefix, depth, uid);
  if (TEXT_TAGS.has(tag) && elementHasOnlyText(node)) {
    return buildText(node, prefix, depth, uid);
  }
  return buildElement(node, prefix, depth, uid);
}

export function convert(html, prefix) {
  prefix = (prefix || "sec").toLowerCase().replace(/[^a-z]/g, "").slice(0, 4) || "sec";
  const uid = makeCounter();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks = [];
  Array.from(doc.body.childNodes).forEach((node) => {
    const b = convertNode(node, prefix, 0, uid);
    if (b) blocks.push(b);
  });
  if (!blocks.length) {
    return { ok: false, error: "No convertible HTML found. Paste a full element (e.g. a <section> or <div>)." };
  }
  const output = blocks.join("\n");
  const m = output.match(/<!-- wp:generateblocks\//g);
  return { ok: true, output, count: m ? m.length : 0 };
}
