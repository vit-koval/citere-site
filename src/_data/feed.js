// Feed and sitemap entries: claims and reports, newest first, capped at 50.
const claims = require("./claims.js");
const reports = require("./reports.js");
const runs = require("./runs.js");

const claimItems = claims.map((claim) => ({
  kind: "claim",
  id: claim.id,
  url: claim.url,
  title: `${claim.verdict.toUpperCase()}: ${claim.title_en}`,
  summary: `Verdict ${claim.verdict} issued ${claim.verdict_date}. Recorded in ${claim.counts.observations} chatbot answers; repeated by ${claim.repeatedBy.length} of 8 chatbots. ${claim.counts.actions} actions taken.`,
  published: claim.verdict_date,
  updated: claim.updated
}));

const reportItems = reports.map((report) => {
  const stats = runs.summariseRuns(report.runs);
  return {
    kind: "report",
    id: report.slug,
    url: `/monitor/${report.slug}/`,
    title: report.title_en,
    summary: `${stats.answers} answers from ${stats.chatbots.length} chatbots in ${stats.countries.length} countries, ${stats.repeated} of them repeating a documented false claim.`,
    published: report.date,
    updated: report.date
  };
});

const items = [...claimItems, ...reportItems]
  .sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0))
  .slice(0, 50);

module.exports = { items, latest: items[0] ? items[0].updated : null };
