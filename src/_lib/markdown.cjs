// Shared loader for everything under content/: front matter + Markdown, split by H2.
// Numbers never live here - prose only (CLAUDE.md section 3).
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
const ROOT = path.join(__dirname, "..", "..");

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function loadDoc(file) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const parts = content.split(/^##[ \t]+/m);
  const intro = parts.shift() || "";
  const sections = {};
  const order = [];
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const title = (nl === -1 ? part : part.slice(0, nl)).trim();
    const body = nl === -1 ? "" : part.slice(nl + 1);
    const id = slugify(title);
    sections[id] = { id, title, html: md.render(body).trim(), text: body.trim() };
    order.push(id);
  }
  return {
    data,
    intro: md.render(intro).trim(),
    introText: intro.trim(),
    html: md.render(content).trim(),
    sections,
    order
  };
}

function loadDir(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return {};
  const out = {};
  for (const file of fs.readdirSync(full).filter((f) => f.endsWith(".md"))) {
    out[file.replace(/\.md$/, "")] = loadDoc(path.join(full, file));
  }
  return out;
}

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

module.exports = { md, slugify, loadDoc, loadDir, readJson, exists, ROOT };
