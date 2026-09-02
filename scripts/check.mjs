#!/usr/bin/env node
// Pre-publish checks against _site/ (CLAUDE.md section 10).
// Errors block the deploy. Warnings are printed and tolerated until launch.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, posix } from "node:path";
import labels from "../src/_lib/labels.cjs";

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = join(ROOT, "_site");

const PATH_PREFIX = (process.env.PATH_PREFIX || "/").replace(/\/*$/, "/");

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

// A rate that claims to average personas is a defect; a sentence promising we
// never do is the opposite, so "never/not averaged" is not a match.
const NEGATED = /\b(never|not|without|refuse to|rather than)\s+(?:be\s+)?$/i;
const PERSONA_AVERAGE_PATTERNS = [
  /averag\w*\s+(?:across|over|of)\s+persona/i,
  /mean\s+(?:across|over)\s+persona/i,
  /persona[- ]averaged/i,
  /average\s+repeat[- ]rate/i,
  /overall\s+repeat[- ]rate/i
];

function personaAveraged(text) {
  for (const re of PERSONA_AVERAGE_PATTERNS) {
    const global = new RegExp(re.source, "gi");
    let match;
    while ((match = global.exec(text)) !== null) {
      if (!NEGATED.test(text.slice(Math.max(0, match.index - 40), match.index))) return re;
    }
  }
  return null;
}

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
const site = JSON.parse(readFileSync(join(ROOT, "data/site.json"), "utf8"));
// The host this build actually writes into canonicals, which is the preview
// host on a preview deploy. PRODUCTION_URL stays the real domain so the demo
// guard below can tell the two apart.
const SITE_URL = (process.env.CANONICAL_URL || `https://${site.domain}`).replace(/\/+$/, "");
const PRODUCTION_URL = `https://${site.domain}`;
const sources = JSON.parse(readFileSync(join(ROOT, "data/sources.json"), "utf8")).domains || [];
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

// Built links carry the path prefix; _site paths do not. Strip it before
// resolving, and treat a prefixed link that escapes the prefix as dead.
function stripPrefix(path) {
  if (PATH_PREFIX === "/") return path;
  if (path === PATH_PREFIX.slice(0, -1)) return "/";
  return path.startsWith(PATH_PREFIX) ? "/" + path.slice(PATH_PREFIX.length) : null;
}

function resolveLink(href, fromPage) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return true;
  if (/^(https?:|mailto:|tel:)/i.test(clean)) return true;
  const absolute = clean.startsWith("/")
    ? clean
    : posix.resolve(posix.dirname(fromPage), clean);
  const base = stripPrefix(absolute);
  if (base === null) return false;
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

  // The aria-label is translated, so the check keys on the class and requires
  // the label to be present in whatever language the page is in.
  const isHome = page === "/index.html";
  const breadcrumbNav = html.match(/<nav[^>]*class="crumbs"[^>]*>/i);
  if (!breadcrumbNav && !isHome) err(page, "no breadcrumb nav");
  else if (breadcrumbNav && !/aria-label="[^"]+"/i.test(breadcrumbNav[0])) {
    err(page, "breadcrumb nav has no aria-label");
  }
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

  const averaged = personaAveraged(text);
  if (averaged) err(page, `persona-averaged figure in page text: ${averaged}`);

  // The declared language must match where the page is served from, or the
  // hreflang cluster points readers and crawlers at the wrong document.
  const declaredLang = (html.match(/<html[^>]+lang="([a-z-]+)"/i) || [])[1];
  const pathLang = page.startsWith("/uk/") ? "uk" : "en";
  if (declaredLang !== pathLang) {
    err(page, `lang="${declaredLang}" but the page is served under /${pathLang === "en" ? "" : pathLang}`);
  }

  // Every hreflang alternate must resolve to a page that exists.
  for (const [, code, href] of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) {
    const altPath = href.startsWith(SITE_URL) ? href.slice(SITE_URL.length) || "/" : null;
    if (altPath === null) err(page, `hreflang ${code} is not on the canonical host: ${href}`);
    else if (!altPath.endsWith("/") ? !sitePaths.has(altPath) : !sitePaths.has(altPath + "index.html")) {
      err(page, `hreflang ${code} points at a missing page: ${altPath}`);
    }
  }

  // --- claim pages ---------------------------------------------------------
  const claimMatch = page.match(/^(?:\/([a-z]{2}))?\/registry\/([^/]+)\/index\.html$/);
  if (claimMatch && claimsBySlug.has(claimMatch[2])) {
    const pageLang = claimMatch[1] || "en";
    const claim = claimsBySlug.get(claimMatch[2]);
    const reviews = (html.match(/"@type":"ClaimReview"/g) || []).length;
    if (reviews !== 1) err(page, `${reviews} ClaimReview blocks, expected exactly 1`);

    const badge = (html.match(/class="badge b-[fmu]"[^>]*>([^<]+)</) || [])[1];
    const expectedBadge = labels.VERDICTS[claim.verdict];
    if (!badge) err(page, "no verdict badge");
    else if (badge.trim() !== expectedBadge) {
      err(page, `verdict badge "${badge.trim()}" does not match data "${claim.verdict}" (expected "${expectedBadge}")`);
    }

    const hasBeforeAfter = /id="what-changed"/.test(html);
    const dataHasBeforeAfter = Array.isArray(claim.before_after) && claim.before_after.length > 0;
    if (hasBeforeAfter && !dataHasBeforeAfter) err(page, "before/after section rendered with no before_after data");
    if (!hasBeforeAfter && dataHasBeforeAfter) err(page, "before_after data present but section missing");

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

// A canonical URL points at the document, not at this build's mount point, so
// machine outputs are checked against unprefixed _site paths.
const canonicalToPath = (url) => {
  if (!url.startsWith(SITE_URL)) return null;
  const path = url.slice(SITE_URL.length) || "/";
  return path.startsWith("/") ? path : null;
};
const pathExists = (path) => {
  const clean = path.split("#")[0].split("?")[0];
  if (clean.endsWith("/")) return sitePaths.has(clean + "index.html");
  return sitePaths.has(clean) || sitePaths.has(clean + "/index.html");
};

// --- sitemaps --------------------------------------------------------------
const sitemapFiles = allFiles.filter((f) => /sitemap[a-z-]*\.xml$/.test(f));
if (sitemapFiles.length) {
  const index = join(SITE, "sitemap.xml");
  if (!existsSync(index)) err("sitemap", "sitemap.xml index is missing");

  const childLocs = new Set();
  for (const file of sitemapFiles) {
    const xml = readFileSync(file, "utf8");
    const isIndex = xml.includes("<sitemapindex");
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const path = canonicalToPath(loc);
      if (path === null) {
        err(relative(SITE, file), `loc is not on ${SITE_URL}: ${loc}`);
        continue;
      }
      if (isIndex) {
        if (!pathExists(path)) err("sitemap.xml", `points at a missing sitemap: ${path}`);
      } else {
        childLocs.add(path);
        if (!pathExists(path)) err(relative(SITE, file), `lists a page that does not exist: ${path}`);
      }
    }
  }

  for (const file of htmlFiles) {
    const path = "/" + relative(SITE, file).split(/[\\/]/).join("/").replace(/index\.html$/, "");
    if (!childLocs.has(path)) err("sitemap", `does not cover ${path}`);
  }
}

// --- robots.txt and llms.txt ----------------------------------------------
for (const name of ["robots.txt", "llms.txt", "llms-full.txt"]) {
  const file = join(SITE, name);
  if (!existsSync(file)) continue;
  const body = readFileSync(file, "utf8");
  for (const [, url] of body.matchAll(new RegExp(`(^|[\\s(<])(${SITE_URL}[^\\s)>\\]]*)`, "g"))) {
    const path = canonicalToPath(url.replace(/[.,]$/, ""));
    if (path !== null && !pathExists(path)) err(name, `lists a path that does not exist: ${path}`);
  }
}

const llms = join(SITE, "llms.txt");
if (existsSync(llms)) {
  const kb = statSync(llms).size / 1024;
  if (kb > 4) err("llms.txt", `${kb.toFixed(1)} KB, max 4 KB`);
}

// --- feeds -----------------------------------------------------------------
let jsonFeedItems = null;
const feedJson = join(SITE, "feed.json");
if (existsSync(feedJson)) {
  try {
    const parsed = JSON.parse(readFileSync(feedJson, "utf8"));
    if (!String(parsed.version || "").includes("jsonfeed.org")) err("feed.json", "no JSON Feed version");
    if (!Array.isArray(parsed.items)) err("feed.json", "items is not an array");
    else {
      jsonFeedItems = parsed.items.length;
      if (parsed.items.length > 50) err("feed.json", `${parsed.items.length} items, max 50`);
      for (const item of parsed.items) {
        const path = canonicalToPath(item.url || "");
        if (path === null || !pathExists(path)) err("feed.json", `item points nowhere: ${item.url}`);
      }
    }
  } catch (e) {
    err("feed.json", `invalid JSON: ${e.message}`);
  }
}

const feedXml = join(SITE, "feed.xml");
if (existsSync(feedXml)) {
  const xml = readFileSync(feedXml, "utf8");
  if (!xml.startsWith("<?xml")) err("feed.xml", "no XML declaration");
  for (const tag of ["<rss", "<channel>", "</channel>", "</rss>"]) {
    if (!xml.includes(tag)) err("feed.xml", `missing ${tag}`);
  }
  const unescaped = xml.match(/&(?!(amp|lt|gt|quot|apos|#\d+);)/g);
  if (unescaped) err("feed.xml", `${unescaped.length} unescaped ampersand(s)`);
  const items = (xml.match(/<item>/g) || []).length;
  if (items > 50) err("feed.xml", `${items} items, max 50`);
  if (jsonFeedItems !== null && items !== jsonFeedItems) {
    err("feed.xml", `${items} items but feed.json has ${jsonFeedItems}`);
  }
}

// --- demonstration data must never carry a production canonical -----------
// site.json.demo means every figure on the site is generated. Shipping that
// under the production host would publish fabricated measurements as findings.
if (site.demo === true) {
  const productionHost = PRODUCTION_URL;
  const built = htmlFiles.length
    ? (readFileSync(htmlFiles[0], "utf8").match(/<link rel="canonical" href="(https?:\/\/[^/"]+)/) || [])[1]
    : null;
  if (built && built === productionHost) {
    err(
      "data/site.json",
      `demo is true but the built canonical host is the production domain (${productionHost}). ` +
        "Set CANONICAL_URL to a preview host, or replace the demo data with a real export."
    );
  }
  const banners = htmlFiles.filter((f) => !/class="demobar"/.test(readFileSync(f, "utf8")));
  if (banners.length) {
    err("demo banner", `${banners.length} page(s) render no demo banner while demo is true`);
  }
} else {
  const leaked = htmlFiles.filter((f) => /class="demobar"/.test(readFileSync(f, "utf8")));
  if (leaked.length) err("demo banner", `${leaked.length} page(s) render a demo banner while demo is off`);
}

// --- security.txt ----------------------------------------------------------
const security = join(SITE, ".well-known/security.txt");
if (existsSync(security)) {
  const body = readFileSync(security, "utf8");
  if (!/^Contact:\s*\S+/m.test(body)) err("security.txt", "no Contact field");
  const expires = (body.match(/^Expires:\s*(\S+)/m) || [])[1];
  if (!expires) err("security.txt", "no Expires field");
  else if (!(Date.parse(expires) > Date.now())) err("security.txt", `Expires is not in the future: ${expires}`);
  if (!/^Preferred-Languages:/m.test(body)) err("security.txt", "no Preferred-Languages field");
}

// The methodology forbids attributing a domain to a network ourselves, so a
// watchlist entry without a published attribution is a launch blocker.
for (const source of sources) {
  if (!(source.attribution || []).length) {
    warn("data/sources.json", `${source.domain} is on the watchlist with no published attribution`);
  }
}


// Lighthouse CI (CLAUDE.md 10, last bullet) lands with build step 9.

for (const w of warnings) console.log(`warn  ${w}`);
if (errors.length) {
  console.error(`\ncheck: ${errors.length} error(s)\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check: ok (${htmlFiles.length} page(s), ${warnings.length} warning(s))`);
