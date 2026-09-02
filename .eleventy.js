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

  eleventyConfig.addFilter("rate", (v) => (v === null || v === undefined ? "n/a" : `${Math.round(v * 1000) / 10}%`));
  eleventyConfig.addFilter("pp", (v) => {
    if (v === null || v === undefined) return "n/a";
    const n = Math.round(v * 1000) / 10;
    return `${n > 0 ? "+" : ""}${n} pp`;
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
    pathPrefix: "/"
  };
};
