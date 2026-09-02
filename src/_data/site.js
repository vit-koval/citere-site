// Site-wide data. Counters in data/site.json are placeholders: they are
// recomputed here from data/ on every build and the stored values are ignored
// (CLAUDE.md section 5.5).
const fs = require("node:fs");
const path = require("node:path");
const { readJson, ROOT } = require("../_lib/markdown.cjs");

const site = readJson("data/site.json");
const escalations = readJson("data/escalations.json");

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

module.exports = {
  ...site,
  url: `https://${site.domain}`,
  counters: {
    claims: claims.length,
    responses: claims.reduce((n, c) => n + (c.observations || []).length, 0),
    escalations_sent: sent.length,
    escalations_answered: answered.length,
    escalations_actioned: actioned.length,
    escalations_total: escalations.length,
    median_response_days: median
  },
  last_update: lastUpdate
};
