#!/usr/bin/env node
// Pre-publish checks against _site/ (CLAUDE.md section 10).
// Errors block the deploy. Warnings are printed and tolerated until launch.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, posix } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = join(ROOT, "_site");

const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

if (!existsSync(SITE)) {
  console.error("check: _site/ does not exist - run npm run build first");
  process.exit(1);
}

const STOP_WORDS = [
  "fight", "combat", "defeat", "war on disinformation", "revolutionary",
  "ai-powered", "cutting-edge", "comprehensive", "unique", "holistic",
  "empower", "innovative"
];

const PERSONA_AVERAGE_PATTERNS = [
  /averag\w*\s+(?:across|over|of)\s+persona/i,
  /mean\s+(?:across|over)\s+persona/i,
  /persona[- ]averaged/i,
  /average\s+repeat[- ]rate/i,
  /overall\s+repeat[- ]rate/i
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(SITE);
const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));
const sitePaths = new Set(
  allFiles.map((f) => "/" + relative(SITE, f).split(/[\\/]/).join("/"))
);

const guards = JSON.parse(readFileSync(join(ROOT, "scripts/guards.json"), "utf8"));
const sources = JSON.parse(readFileSync(join(ROOT, "data/sources.json"), "utf8"));
const claims = existsSync(join(ROOT, "data/claims"))
  ? readdirSync(join(ROOT, "data/claims"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(ROOT, "data/claims", f), "utf8")))
  : [];
const claimsBySlug = new Map(claims.map((c) => [c.slug, c]));

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");

function resolveLink(href, fromPage) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return true;
  if (/^(https?:|mailto:|tel:)/i.test(clean)) return true;
  const base = clean.startsWith("/")
    ? clean
    : posix.resolve(posix.dirname(fromPage), clean);
  if (base.endsWith("/")) return sitePaths.has(base + "index.html");
  return sitePaths.has(base) || sitePaths.has(base + "/index.html");
}

for (const file of htmlFiles) {
  const page = "/" + relative(SITE, file).split(/[\\/]/).join("/");
  const html = readFileSync(file, "utf8");
  const text = stripTags(html);
  const bytes = Buffer.byteLength(html, "utf8");

  // --- structure -----------------------------------------------------------
  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length !== 1) err(page, `${h1s.length} <h1> elements, expected exactly 1`);

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  if (!title) err(page, "no <title>");
  else if (title.trim().length > 65) err(page, `<title> is ${title.trim().length} chars, max 65`);

  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1];
  if (!desc) err(page, "no meta description");
  else if (desc.length < 120 || desc.length > 160) {
    err(page, `meta description is ${desc.length} chars, must be 120-160`);
  }

  if (!/<link\s+rel="canonical"/i.test(html)) err(page, "no canonical link");
  if (!/<html[^>]+lang="[a-z-]+"/i.test(html)) err(page, "no lang on <html>");
  if (bytes > 60 * 1024) err(page, `${Math.round(bytes / 1024)} KB of HTML, max 60 KB`);

  const scripts = html.match(/<script[^>]*>/gi) || [];
  for (const tag of scripts) {
    if (!/type="application\/ld\+json"/i.test(tag)) err(page, `inline <script> that is not JSON-LD: ${tag}`);
  }

  if (!/<nav[^>]+aria-label="Breadcrumb"/i.test(html)) err(page, "no breadcrumb nav");
  if (!/"@type":"BreadcrumbList"/.test(html)) err(page, "no BreadcrumbList JSON-LD");

  // --- JSON-LD validity ----------------------------------------------------
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  if (!blocks.length) err(page, "no JSON-LD");
  for (const [, body] of blocks) {
    try {
      JSON.parse(body);
    } catch (e) {
      err(page, `invalid JSON-LD: ${e.message}`);
    }
  }

  // --- language ------------------------------------------------------------
  for (const word of STOP_WORDS) {
    const re = new RegExp(`(^|[^a-z-])${word.replace(/[-]/g, "[- ]")}(s|es|ing|ed)?($|[^a-z-])`, "i");
    if (re.test(text)) err(page, `stop-word from content.md B: "${word}"`);
  }

  for (const s of guards.forbidden_strings) {
    if (s && html.includes(s)) err(page, "contains a guarded P4 prompt string");
  }

  // --- watchlisted domains are never linked --------------------------------
  const hrefs = [...html.matchAll(/<a[^>]+href="([^"]*)"/gi)].map((m) => m[1]);
  for (const source of sources) {
    for (const href of hrefs) {
      if (href.includes(source.domain)) err(page, `watchlisted domain linked: ${source.domain}`);
    }
    const bare = new RegExp(`(^|[^\\[a-z0-9.-])${source.domain.replace(/\./g, "\\.")}`, "i");
    if (bare.test(text)) err(page, `watchlisted domain printed undefanged: ${source.domain}`);
  }

  // --- links ---------------------------------------------------------------
  for (const href of hrefs) {
    if (!resolveLink(href, page)) err(page, `dead internal link: ${href}`);
  }

  // --- claim pages ---------------------------------------------------------
  const claimMatch = page.match(/^\/registry\/([^/]+)\/index\.html$/);
  if (claimMatch && claimsBySlug.has(claimMatch[1])) {
    const claim = claimsBySlug.get(claimMatch[1]);
    const reviews = (html.match(/"@type":"ClaimReview"/g) || []).length;
    if (reviews !== 1) err(page, `${reviews} ClaimReview blocks, expected exactly 1`);

    const badge = (html.match(/class="badge badge-verdict[^"]*">([^<]+)</) || [])[1];
    if (!badge) err(page, "no verdict badge");
    else if (badge.trim().toLowerCase() !== claim.verdict) {
      err(page, `verdict badge "${badge.trim()}" does not match data "${claim.verdict}"`);
    }

    const hasBeforeAfter = /id="what-changed"/.test(html);
    const dataHasBeforeAfter = Array.isArray(claim.before_after) && claim.before_after.length > 0;
    if (hasBeforeAfter && !dataHasBeforeAfter) err(page, "before/after section rendered with no before_after data");
    if (!hasBeforeAfter && dataHasBeforeAfter) err(page, "before_after data present but section missing");

    for (const re of PERSONA_AVERAGE_PATTERNS) {
      if (re.test(text)) err(page, `persona-averaged figure in page text: ${re}`);
    }

    // Every observations row must carry its own persona cell.
    const table = (html.match(/<table[^>]*class="[^"]*observations[^"]*"[\s\S]*?<\/table>/i) || [])[0];
    if (table) {
      const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].slice(1);
      for (const [, row] of rows) {
        if (!/data-persona="P[1-4]"/.test(row)) err(page, "observations row without a persona");
      }
    }
  }

  // --- pre-launch placeholders --------------------------------------------
  if (text.includes("{{TODO}}")) warn(page, "contains {{TODO}} placeholder prose");
  if (/coming soon/i.test(text)) err(page, 'contains a "coming soon" placeholder');
}

// --- site-wide -------------------------------------------------------------
if (!htmlFiles.length) {
  console.log("check: no HTML pages yet");
}

const sitemap = join(SITE, "sitemap.xml");
if (existsSync(sitemap)) {
  const xml = readFileSync(sitemap, "utf8");
  for (const file of htmlFiles) {
    const url = "/" + relative(SITE, file).split(/[\\/]/).join("/").replace(/index\.html$/, "");
    if (!xml.includes(url)) err("sitemap.xml", `does not cover ${url}`);
  }
}

for (const name of ["robots.txt", "llms.txt"]) {
  const f = join(SITE, name);
  if (!existsSync(f)) continue;
  const body = readFileSync(f, "utf8");
  for (const [, path] of body.matchAll(/(?:^|\s)(\/[a-z0-9./_-]*)/gi)) {
    if (path === "/") continue;
    const ok = path.endsWith("/")
      ? sitePaths.has(path + "index.html")
      : sitePaths.has(path) || sitePaths.has(path + "/index.html");
    if (!ok) err(name, `lists a path that does not exist: ${path}`);
  }
}

// The methodology forbids attributing a domain to a network ourselves, so a
// watchlist entry without a published attribution is a launch blocker.
for (const source of sources) {
  if (!(source.attribution || []).length) {
    warn("data/sources.json", `${source.domain} is on the watchlist with no published attribution`);
  }
}

const css = join(SITE, "css/site.css");
if (existsSync(css)) {
  const kb = statSync(css).size / 1024;
  if (kb > 12) err("css/site.css", `${kb.toFixed(1)} KB, max 12 KB`);
}

// Lighthouse CI (CLAUDE.md 10, last bullet) lands with build step 9.

for (const w of warnings) console.log(`warn  ${w}`);
if (errors.length) {
  console.error(`\ncheck: ${errors.length} error(s)\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check: ok (${htmlFiles.length} page(s), ${warnings.length} warning(s))`);
