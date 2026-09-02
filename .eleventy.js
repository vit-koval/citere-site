const { md: markdown } = require("./src/_lib/markdown.cjs");

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const VERDICTS = { false: "FALSE", misleading: "MISLEADING", unsupported: "UNSUPPORTED" };
const BEHAVIOURS = { repeated: "Repeated", contextualised: "Contextualised", refuted: "Refuted", dodged: "Dodged" };
const STATUSES = {
  submitted: "Submitted", acknowledged: "Acknowledged", actioned: "Actioned",
  no_response: "No response", declined: "Declined", completed: "Completed",
  live: "Live", published: "Published", receipt_confirmed: "Receipt confirmed"
};
const ACTION_TYPES = {
  published: "Published this page", platform_report: "Reported", domain_complaint: "Domain complaint",
  shared: "Shared with", partner_publication: "Published by",
  authority_confirmation: "Authority confirmation", remeasured: "Re-measured"
};
const NETWORKS = {
  pravda: "Pravda", doppelganger: "Doppelganger", matryoshka: "Matryoshka",
  "storm-1516": "Storm-1516", "state-media": "State media", other: "Other"
};

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

  eleventyConfig.addFilter("displayDate", (value) => {
    if (!value) return "";
    const [y, m, d] = String(value).slice(0, 10).split("-");
    if (!y || !m || !d) return String(value);
    return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
  });
  eleventyConfig.addFilter("isoDate", (value) => String(value || "").slice(0, 10));
  eleventyConfig.addFilter("year", (value) => String(value || "").slice(0, 4));

  // Watchlisted domains are printed, never linked and never live.
  eleventyConfig.addFilter("defang", (domain) => String(domain || "").replace(/\./g, "[.]"));
  eleventyConfig.addFilter("domainSlug", (domain) => String(domain || "").replace(/\./g, "-"));

  eleventyConfig.addFilter("verdictLabel", (v) => VERDICTS[v] || String(v || "").toUpperCase());
  eleventyConfig.addFilter("behaviourLabel", (v) => BEHAVIOURS[v] || v);
  eleventyConfig.addFilter("statusLabel", (v) => STATUSES[v] || v);
  eleventyConfig.addFilter("actionTypeLabel", (v) => ACTION_TYPES[v] || v);
  eleventyConfig.addFilter("networkLabel", (v) => NETWORKS[v] || v);

  const CHATBOTS = {
    chatgpt: "ChatGPT", gemini: "Gemini", grok: "Grok", claude: "Claude",
    copilot: "Copilot", perplexity: "Perplexity", deepseek: "DeepSeek", "le-chat": "Le Chat"
  };
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const langNames = new Intl.DisplayNames(["en"], { type: "language" });

  eleventyConfig.addFilter("chatbotLabel", (v) => CHATBOTS[v] || v);
  eleventyConfig.addFilter("countryName", (v) => {
    try { return regionNames.of(String(v).toUpperCase()) || String(v).toUpperCase(); }
    catch { return String(v).toUpperCase(); }
  });
  eleventyConfig.addFilter("languageName", (v) => {
    try { return langNames.of(String(v)) || v; } catch { return v; }
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
  eleventyConfig.addFilter("plural", (count, one, many) => (Number(count) === 1 ? one : many));
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
