// Claim records joined to their prose. data/ holds every number, content/ holds
// every sentence; this is the only place the two meet (CLAUDE.md section 3).
const fs = require("node:fs");
const path = require("node:path");
const { loadDoc, ROOT } = require("../_lib/markdown.cjs");

const dir = path.join(ROOT, "data/claims");
if (!fs.existsSync(dir)) module.exports = [];
else {
  const claims = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
    .map((claim) => {
      const prose = {};
      for (const lang of ["en", "uk"]) {
        const file = path.join(ROOT, "content", lang, "claims", `${claim.id}.md`);
        if (fs.existsSync(file)) prose[lang] = loadDoc(file);
      }
      const behaviours = (claim.observations || []).map((o) => o.behaviour);
      return {
        ...claim,
        raw: claim,
        prose,
        url: `/registry/${claim.slug}/`,
        title: claim.title_en,
        chatbots: [...new Set((claim.observations || []).map((o) => o.chatbot))].sort(),
        repeatedBy: [
          ...new Set((claim.observations || []).filter((o) => o.behaviour === "repeated").map((o) => o.chatbot))
        ].sort(),
        citedDomains: [
          ...new Set((claim.observations || []).flatMap((o) => o.cited_domains || []))
        ].sort(),
        counts: {
          observations: behaviours.length,
          repeated: behaviours.filter((b) => b === "repeated").length,
          actions: (claim.actions || []).length,
          responses: (claim.actions || []).filter((a) => a.response_date).length
        },
        nonEvasive: behaviours.filter((b) => b !== "dodged").length,
        escalationStatus: (claim.actions || [])
          .filter((a) => a.type === "platform_report")
          .map((a) => a.status)
          .pop() || null,
        remeasuredOn: (claim.actions || []).filter((a) => a.type === "remeasured").map((a) => a.date).pop() || null
      };
    });

  claims.sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0));
  module.exports = claims;
}
