const { md: markdown } = require("./src/_lib/markdown.cjs");

const ui = require("./src/_data/ui.js");
const {
  VERDICTS, BEHAVIOURS, STATUSES, ACTION_TYPES, NETWORKS, CHATBOTS, MONTHS, pick
} = require("./src/_lib/labels.cjs");

// Comment strip + whitespace collapse only. Deliberately conservative: nothing that
// can change selector meaning (no touching spaces around ":" or combinators).
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

module.exports = function (eleventyConfig) {
  eleventyConfig.setLiquidOptions({ jekyllInclude: false });
  eleventyConfig.addPassthroughCopy({ CNAME: "CNAME" });
  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.ignores.add("**/node_modules/**");

  // Stylesheet is the only asset with a build step, and that step is minification.
  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: (inputContent) => () => minifyCss(inputContent)
  });

  eleventyConfig.addFilter("displayDate", function (value, langOverride) {
    if (!value) return "";
    const lang = langOverride || (this.ctx && this.ctx.lang) || "en";
    const [y, m, d] = String(value).slice(0, 10).split("-");
    if (!y || !m || !d) return String(value);
    return `${Number(d)} ${(MONTHS[lang] || MONTHS.en)[Number(m) - 1]} ${y}`;
  });

  // Interface strings. Unknown keys throw: a typo must not ship as blank chrome.
  // A missing Ukrainian key falls back to English (CLAUDE.md 2).
  eleventyConfig.addFilter("t", function (key, ...args) {
    const lang = (this.ctx && this.ctx.lang) || "en";
    let value = (ui[lang] || ui.en)[key];
    if (value === undefined) value = ui.en[key];
    if (value === undefined) throw new Error(`ui: unknown string key "${key}"`);
    for (const arg of args) value = value.replace("%s", String(arg));
    return value;
  });

  // Mount-point aware sibling URL: /about/ in English, /uk/about/ in Ukrainian.
  eleventyConfig.addFilter("loc", (path, lang) =>
    lang && lang !== "en" ? `/${lang}${path}` : path
  );
  eleventyConfig.addFilter("isoDate", (value) => String(value || "").slice(0, 10));
  eleventyConfig.addFilter("year", (value) => String(value || "").slice(0, 4));

  // Watchlisted domains are printed, never linked and never live.
  eleventyConfig.addFilter("defang", (domain) => String(domain || "").replace(/\./g, "[.]"));
  eleventyConfig.addFilter("domainSlug", (domain) => String(domain || "").replace(/\./g, "-"));

  const langOf = (ctx, override) => override || (ctx && ctx.lang) || "en";
  eleventyConfig.addFilter("verdictLabel", function (v, l) { return pick(VERDICTS, langOf(this.ctx, l), v); });
  eleventyConfig.addFilter("behaviourLabel", function (v, l) { return pick(BEHAVIOURS, langOf(this.ctx, l), v); });
  eleventyConfig.addFilter("statusLabel", function (v, l) { return pick(STATUSES, langOf(this.ctx, l), v); });
  eleventyConfig.addFilter("actionTypeLabel", function (v, l) { return pick(ACTION_TYPES, langOf(this.ctx, l), v); });
  eleventyConfig.addFilter("networkLabel", function (v, l) { return pick(NETWORKS, langOf(this.ctx, l), v); });

  const displayNames = (lang, type) => {
    try { return new Intl.DisplayNames([lang], { type }); } catch { return null; }
  };
  const nameCache = new Map();
  const nameOf = (lang, type, value) => {
    const cacheKey = `${lang}|${type}`;
    if (!nameCache.has(cacheKey)) nameCache.set(cacheKey, displayNames(lang, type));
    const formatter = nameCache.get(cacheKey);
    const raw = type === "region" ? String(value).toUpperCase() : String(value);
    try { return (formatter && formatter.of(raw)) || raw; } catch { return raw; }
  };

  eleventyConfig.addFilter("chatbotLabel", (v) => CHATBOTS[v] || v);
  eleventyConfig.addFilter("countryName", function (v, l) {
    return nameOf(langOf(this.ctx, l), "region", v);
  });
  eleventyConfig.addFilter("languageName", function (v, l) {
    return nameOf(langOf(this.ctx, l), "language", v);
  });

  eleventyConfig.addFilter("rate", (v) => (v === null || v === undefined ? "n/a" : `${Math.round(v * 1000) / 10}%`));
  eleventyConfig.addFilter("pp", (v) => {
    if (v === null || v === undefined) return "n/a";
    const n = Math.round(v * 1000) / 10;
    return `${n > 0 ? "+" : ""}${n} pp`;
  });

  // Prose in content/ carries no numbers; where a sentence needs one it writes
  // {{ name }} and the template supplies the value from data/ (CLAUDE.md 11.1).
  // Unknown names are left untouched, so a {{TODO}} marker survives to check.mjs.
  eleventyConfig.addFilter("fill", (text, values) =>
    String(text || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(values || {}, key) ? String(values[key]) : match
    )
  );
  eleventyConfig.addFilter("md", (text) => markdown.render(String(text || "")).trim());

  eleventyConfig.addFilter("sumField", (rows, field) =>
    (rows || []).reduce((total, row) => total + (Number(row[field]) || 0), 0)
  );
  // Slavic languages need three forms; English uses the first and third.
  eleventyConfig.addFilter("plural", function (count, one, many, few) {
    const lang = (this.ctx && this.ctx.lang) || "en";
    const n = Math.abs(Number(count));
    if (lang !== "uk" || few === undefined) return n === 1 ? one : many;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  });
  eleventyConfig.addFilter("take", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("unique", (arr) => [...new Set([].concat(arr || []))]);
  eleventyConfig.addFilter("sortBy", (arr, key, dir) => {
    const out = [...(arr || [])];
    out.sort((a, b) => String(a[key] || "").localeCompare(String(b[key] || "")));
    return dir === "desc" ? out.reverse() : out;
  });
  eleventyConfig.addFilter("whereEq", (arr, key, value) =>
    (arr || []).filter((item) => {
      const held = item[key];
      return Array.isArray(held) ? held.includes(value) : held === value;
    })
  );

  // Strips nulls, empties and unresolved {{TODO}} values so JSON-LD never
  // describes something the page does not actually state (CLAUDE.md section 7).
  eleventyConfig.addFilter("compact", function compact(value) {
    if (Array.isArray(value)) {
      const out = value.map(compact).filter((v) => v !== undefined);
      return out.length ? out : undefined;
    }
    if (value && typeof value === "object") {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        const cleaned = compact(v);
        if (cleaned !== undefined) out[k] = cleaned;
      }
      return Object.keys(out).length ? out : undefined;
    }
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const t = value.trim();
      return t === "" || t.includes("{{TODO}}") ? undefined : value;
    }
    return value;
  });

  eleventyConfig.addFilter("isReal", (v) => {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim() !== "" && !v.includes("{{TODO}}");
    return true;
  });

  // JSON-LD: block any string that could close the script element early.
  eleventyConfig.addFilter("jsonld", (value) =>
    JSON.stringify(value, null, 0).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
  );
  // Deterministic STIX ids: the same domain yields the same indicator id on
  // every build, so consumers can diff bundles between releases.
  eleventyConfig.addFilter("stixId", (domain) => {
    const hash = require("node:crypto").createHash("sha256").update(String(domain)).digest("hex");
    const uuid = [
      hash.slice(0, 8),
      hash.slice(8, 12),
      "5" + hash.slice(13, 16),
      ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
      hash.slice(20, 32)
    ].join("-");
    return `indicator--${uuid}`;
  });

  eleventyConfig.addFilter("xmlEscape", (value) =>
    String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  );

  // RFC 822 date for RSS. Built from the ISO date in data, always UTC.
  eleventyConfig.addFilter("rfc822", (value) => {
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? "" : d.toUTCString();
  });
  eleventyConfig.addFilter("rfc3339", (value) => {
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  });

  eleventyConfig.addFilter("csvCell", (value) => {
    const s = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["njk", "md", "css"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    // Where the built site is mounted. GitHub Pages serves this repo from
    // /citere-site/; the custom domain serves it from /. Canonical URLs and
    // JSON-LD always point at site.url and ignore this.
    pathPrefix: process.env.PATH_PREFIX || "/"
  };
};
