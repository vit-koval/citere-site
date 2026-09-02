// Claim records joined to their prose. data/ holds every number, content/ holds
// every sentence; this is the only place the two meet (CLAUDE.md 3).
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("../_lib/markdown.cjs");
const { CHATBOTS } = require("../_lib/labels.cjs");

const dir = path.join(ROOT, "data/claims");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];

// The registry status chip in the mockup, derived from what we actually did.
function escalationStatus(actions) {
  const reports = actions.filter((a) => a.type === "platform_report");
  if (actions.some((a) => a.type === "remeasured" && a.status === "completed")) {
    return { label: "Re-measured", cls: "ok" };
  }
  if (reports.length && reports.some((a) => !a.response_date && a.status !== "declined")) {
    return { label: "Awaiting response", cls: "wait" };
  }
  if (reports.length) return { label: "Reported", cls: "" };
  if (actions.some((a) => a.type === "published")) return { label: "Published", cls: "" };
  return null;
}

const claims = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
  .map((claim) => {
    const proseFile = path.join(ROOT, "content/en/claims", `${claim.id}.md`);
    const observations = claim.observations || [];
    const actions = claim.actions || [];
    const repeatedBy = [...new Set(observations.filter((o) => o.behaviour === "repeated").map((o) => o.chatbot))];
    return {
      ...claim,
      raw: claim,
      url: `/registry/${claim.slug}/`,
      titles: { en: claim.title_en, uk: claim.title_uk || claim.title_en },
      hasProse: fs.existsSync(proseFile),
      chatbots: [...new Set(observations.map((o) => o.chatbot))],
      repeatedBy,
      // The mockup shows "3 / 8": repeated by, out of every assistant we test.
      botsTested: Object.keys(CHATBOTS).length,
      citedDomains: [...new Set(observations.flatMap((o) => o.cited_domains || []))].sort(),
      langLabel: (claim.languages || []).map((l) => l.toUpperCase()).join(" "),
      counts: {
        observations: observations.length,
        repeated: observations.filter((o) => o.behaviour === "repeated").length,
        actions: actions.length,
        responses: actions.filter((a) => a.response_date).length
      },
      // The mockup shows a six-row excerpt of this table. Real claims carry
      // 32-128 recorded answers, which would blow the 60 KB page budget in
      // CLAUDE.md 2, so the page shows an excerpt and links the full set.
      observationsShown: observations.slice(0, 24),
      observationsTruncated: observations.length > 24,
      remeasuredOn: actions.filter((a) => a.type === "remeasured").map((a) => a.date).pop() || null,
      status: escalationStatus(actions)
    };
  });

claims.sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0));

module.exports = claims;
