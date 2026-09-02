// Facet pages are the no-JS filter UI CLAUDE.md 2 requires: every filter state
// is also a static URL. One page per facet value with at least one claim.
const claims = require("./claims.js");
const clusters = require("./clusters.js");
const { CHATBOTS, VERDICTS } = require("../_lib/labels.cjs");

const region = new Intl.DisplayNames(["en"], { type: "region" });
const language = new Intl.DisplayNames(["en"], { type: "language" });
const safe = (fn, v) => { try { return fn(v) || v; } catch { return v; } };

const TYPES = [
  { type: "cluster", heading: "Cluster", values: (c) => [c.cluster],
    label: (v) => (clusters[v] && clusters[v].name_en) || v.replace(/-/g, " ") },
  { type: "country", heading: "Country", values: (c) => c.countries,
    label: (v) => safe((x) => region.of(x.toUpperCase()), v) },
  { type: "language", heading: "Language", values: (c) => c.languages,
    label: (v) => safe((x) => language.of(x), v) },
  { type: "chatbot", heading: "Chatbot", values: (c) => c.chatbots,
    label: (v) => (CHATBOTS[v] || {}).name || v },
  { type: "verdict", heading: "Verdict", values: (c) => [c.verdict],
    label: (v) => VERDICTS[v] || v }
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
