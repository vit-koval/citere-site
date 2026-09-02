// Facet pages are the no-JS filter UI required by CLAUDE.md 6: every filter
// combination that exists in the data is also a static URL. One page per facet
// value with at least one claim.
const claims = require("./claims.js");
const clusters = require("./clusters.js");

const CHATBOTS = {
  chatgpt: "ChatGPT", gemini: "Gemini", grok: "Grok", claude: "Claude",
  copilot: "Copilot", perplexity: "Perplexity", deepseek: "DeepSeek", "le-chat": "Le Chat"
};
const VERDICTS = { false: "FALSE", misleading: "MISLEADING", unsupported: "UNSUPPORTED" };
const region = new Intl.DisplayNames(["en"], { type: "region" });
const language = new Intl.DisplayNames(["en"], { type: "language" });

const TYPES = [
  {
    type: "cluster",
    heading: "Cluster",
    values: (claim) => [claim.cluster],
    label: (v) => (clusters[v] && clusters[v].name_en) || v.replace(/-/g, " ")
  },
  {
    type: "country",
    heading: "Country",
    values: (claim) => claim.countries,
    label: (v) => {
      try { return region.of(v.toUpperCase()) || v.toUpperCase(); } catch { return v.toUpperCase(); }
    }
  },
  {
    type: "language",
    heading: "Language",
    values: (claim) => claim.languages,
    label: (v) => {
      try { return language.of(v) || v; } catch { return v; }
    }
  },
  {
    type: "chatbot",
    heading: "Chatbot",
    values: (claim) => claim.chatbots,
    label: (v) => CHATBOTS[v] || v
  },
  {
    type: "verdict",
    heading: "Verdict",
    values: (claim) => [claim.verdict],
    label: (v) => VERDICTS[v] || v
  }
];

const facets = [];
for (const spec of TYPES) {
  const buckets = new Map();
  for (const claim of claims) {
    for (const value of spec.values(claim) || []) {
      if (!buckets.has(value)) buckets.set(value, []);
      buckets.get(value).push(claim);
    }
  }
  for (const [value, list] of [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    facets.push({
      type: spec.type,
      heading: spec.heading,
      value,
      label: spec.label(value),
      url: `/registry/${spec.type}/${value}/`,
      claims: list,
      repeatedIn: list.filter((c) => c.counts.repeated > 0).length,
      observations: list.reduce((n, c) => n + c.counts.observations, 0),
      updated: list.map((c) => c.updated).sort().pop()
    });
  }
}

module.exports = facets;
