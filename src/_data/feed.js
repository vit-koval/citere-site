// Feed entries: claims and reports, newest first, capped at 50.
const claims = require("./claims.js");
const reports = require("./reports.js");
const { VERDICTS } = require("../_lib/labels.cjs");

const items = [
  ...claims.map((c) => ({
    kind: "claim",
    url: c.url,
    title: `${VERDICTS[c.verdict]}: ${c.title_en}`,
    summary: `Verdict ${c.verdict} issued ${c.verdict_date}. Recorded in ${c.counts.observations} chatbot answers; repeated by ${c.repeatedBy.length} of ${c.botsTested} assistants. ${c.counts.actions} actions taken.`,
    published: c.verdict_date,
    updated: c.updated
  })),
  ...reports.map((r) => ({
    kind: "report",
    url: r.url,
    title: r.title,
    summary: `${r.n_responses} responses from ${(r.chatbots || []).length} assistants across ${(r.countries || []).length} markets.`,
    published: r.date,
    updated: r.date
  }))
]
  .sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0))
  .slice(0, 50);

module.exports = { items, latest: items[0] ? items[0].updated : null };
