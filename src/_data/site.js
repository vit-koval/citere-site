// Site-wide data. Counters in data/site.json are placeholders: they are
// recomputed here from data/ on every build and the stored values are ignored
// (CLAUDE.md section 5.5).
const fs = require("node:fs");
const path = require("node:path");
const { readJson, ROOT } = require("../_lib/markdown.cjs");

const site = readJson("data/site.json");
const escalationsFile = readJson("data/escalations.json");
const escalations = escalationsFile.actions || [];

const claimDir = path.join(ROOT, "data/claims");
const claims = fs.existsSync(claimDir)
  ? fs
      .readdirSync(claimDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(claimDir, f), "utf8")))
  : [];

const OUTBOUND = new Set(["platform_report", "domain_complaint"]);
const ANSWERED = new Set(["acknowledged", "actioned", "declined", "completed", "receipt_confirmed"]);

const sent = escalations.filter((e) => OUTBOUND.has(e.type));
const answered = sent.filter((e) => e.response_date || ANSWERED.has(e.status));
const actioned = sent.filter((e) => e.status === "actioned");

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
    escalations_sent: sent.length,
    escalations_answered: answered.length,
    escalations_actioned: actioned.length,
    escalations_total: escalations.length,
    median_response_days: median
  },
  last_update: lastUpdate
};
