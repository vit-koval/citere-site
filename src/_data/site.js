// Site-wide data. Counters in data/site.json are placeholders: they are
// recomputed here from data/ on every build and the stored values are ignored
// (CLAUDE.md section 5.5).
const fs = require("node:fs");
const path = require("node:path");
const { readJson, ROOT } = require("../_lib/markdown.cjs");

const site = readJson("data/site.json");
const countermeasures = require("./countermeasures.js");

const claimDir = path.join(ROOT, "data/claims");
const claims = fs.existsSync(claimDir)
  ? fs
      .readdirSync(claimDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(claimDir, f), "utf8")))
  : [];

// Catalogue §2.4 and §2.6 are internal: a catalog update and a dataset
// publication are things we did to our own records, not things we sent anyone.
// A re-measurement is our own re-run and is already excluded by `taken`.
const INTERNAL = new Set(["catalog", "github"]);
const ANSWERED = new Set(["acknowledged", "responded", "closed", "declined"]);

const sent = countermeasures.actions.filter((e) => e.taken && !INTERNAL.has(e.type));
const answered = sent.filter((e) => e.response_date || ANSWERED.has(e.status));
const actioned = sent.filter((e) => e.status === "responded" || e.status === "closed");

const responseDays = answered
  .filter((e) => e.response_date)
  .map((e) => (Date.parse(e.response_date) - Date.parse(e.date)) / 86400000)
  .sort((a, b) => a - b);
const median = responseDays.length
  ? Math.round(responseDays[Math.floor(responseDays.length / 2)])
  : null;

const lastUpdate = [site.last_update, ...claims.map((c) => c.updated)].filter(Boolean).sort().pop();

const { CHATBOTS } = require("../_lib/labels.cjs");
const sources = readJson("data/sources.json").domains || [];
const benchmarks = readJson("data/benchmarks.json");

module.exports = {
  ...site,
  // The canonical host. Defaults to the production domain; CANONICAL_URL
  // overrides it for a preview deploy, which is what lets a demo build ship
  // somewhere that is not production (see scripts/check.mjs).
  url: (process.env.CANONICAL_URL || `https://${site.domain}`).replace(/\/+$/, ""),
  productionUrl: `https://${site.domain}`,
  isDemo: site.demo === true,
  counters: {
    claims: claims.length,
    clusters: new Set(claims.map((c) => c.cluster)).size,
    chatbots: new Set((benchmarks.heatmap || []).map((r) => r.chatbot)).size || Object.keys(CHATBOTS).length,
    personas: new Set((benchmarks.heatmap || []).map((r) => r.persona)).size || 4,
    languages: new Set(claims.flatMap((c) => c.languages || [])).size,
    domains: sources.length,
    responses: claims.reduce((n, c) => n + (c.observations || []).length, 0),
    countermeasures_sent: sent.length,
    countermeasures_answered: answered.length,
    countermeasures_actioned: actioned.length,
    countermeasures_taken: countermeasures.totals.taken,
    countermeasures_total: countermeasures.totals.logged,
    remeasurements: countermeasures.totals.remeasurements,
    median_response_days: median
  },
  last_update: lastUpdate
};
