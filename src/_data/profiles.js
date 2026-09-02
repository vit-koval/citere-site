// Per-assistant and per-market profiles, assembled from the precomputed
// aggregates in platforms.json, countries.json and benchmarks.json. No page
// does arithmetic on observations at build time (CLAUDE.md 5.2).
const platforms = require("./platforms.js");
const countriesData = require("./countries.js");
const claims = require("./claims.js");
const escalations = require("./escalations.js");
const benchmarks = require("./benchmarks.js");
const { CHATBOTS } = require("../_lib/labels.cjs");

const lb = benchmarks.leaderboards || {};
const rowFor = (board, key) => (lb[board] || []).find((r) => r.key === key);
const claimById = new Map(claims.map((c) => [c.id, c]));

const chatbots = Object.entries(platforms).map(([key, meta]) => {
  const run = (meta.runs || [])[0] || {};
  const repeat = rowFor("chatbot_repeat", key);
  const contamination = rowFor("chatbot_contamination", key);
  const repeatedClaims = (meta.claims_repeated || []).map((id) => claimById.get(id)).filter(Boolean);
  return {
    key,
    name: meta.name || (CHATBOTS[key] || {}).name || key,
    company: meta.company,
    url: `/platforms/${key}/`,
    run,
    modelVersion: run.model_version,
    // Every rate here is a per-persona figure or an explicitly labelled
    // contamination share; nothing is averaged across personas.
    repeatRate: repeat ? repeat.value : null,
    repeatPersona: "P2",
    repeatN: repeat ? repeat.n : null,
    repeatDelta: repeat ? repeat.delta : null,
    contaminationRate: contamination ? contamination.value : (run.contamination_rate ?? null),
    contaminationN: run.n ?? null,
    byPersona: Object.entries(run.by_persona || {}).map(([persona, v]) => ({ persona, ...v })),
    byCountry: Object.entries(run.by_country || {}).map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.repeat_rate - a.repeat_rate),
    repeatedClaims,
    claimsRepeated: repeatedClaims.length,
    // The escalation log names the company we wrote to.
    escalations: escalations.actions.filter(
      (e) => e.target === meta.company || (meta.escalations || []).includes(e.claim_id) && e.target === meta.company
    ),
    escalationClaims: meta.escalations || []
  };
}).sort((a, b) => (b.repeatRate ?? -1) - (a.repeatRate ?? -1));

const matrixByCountry = new Map();
for (const cell of benchmarks.country_matrix || []) {
  if (!matrixByCountry.has(cell.country)) matrixByCountry.set(cell.country, []);
  matrixByCountry.get(cell.country).push(cell);
}

const countries = Object.entries(countriesData).map(([key, meta]) => ({
  key,
  name: meta.name,
  url: `/countries/${key}/`,
  language: meta.language,
  repeatRate: meta.repeat_rate,
  contaminationRate: meta.contamination_rate,
  n: meta.n,
  partners: meta.partners || [],
  note: meta.note_en,
  rows: (matrixByCountry.get(key) || [])
    .map((cell) => ({ ...cell, name: (platforms[cell.chatbot] || {}).name || cell.chatbot }))
    .sort((a, b) => b.rate - a.rate),
  claims: claims.filter((c) => (c.countries || []).includes(key)),
  bots: [...new Set((matrixByCountry.get(key) || []).sort((a, b) => b.rate - a.rate).map((c) => c.chatbot))].slice(0, 5)
})).sort((a, b) => (b.repeatRate ?? 0) - (a.repeatRate ?? 0));

// chatbot x country grid for the countries index.
const matrix = {
  chatbots: chatbots.map((c) => c.key),
  countries: countries.map((c) => c.key),
  rows: chatbots.map((c) => ({
    chatbot: c.key,
    name: c.name,
    cells: countries.map((country) =>
      (benchmarks.country_matrix || []).find((m) => m.chatbot === c.key && m.country === country.key) || null
    ),
    spread: ((benchmarks.country_matrix || []).find((m) => m.chatbot === c.key) || {}).spread ?? null
  }))
};

const clusterGrid = (() => {
  const byCluster = new Map();
  for (const cell of benchmarks.cluster_by_country || []) {
    if (!byCluster.has(cell.cluster)) byCluster.set(cell.cluster, {});
    byCluster.get(cell.cluster)[cell.country] = cell.rate;
  }
  return [...byCluster.entries()].map(([cluster, cells]) => ({ cluster, cells }));
})();

module.exports = { chatbots, countries, matrix, clusterGrid };
