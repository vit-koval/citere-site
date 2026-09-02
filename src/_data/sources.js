const { readJson } = require("../_lib/markdown.cjs");
const claims = require("./claims.js");

const sources = readJson("data/sources.json");
const byId = new Map(claims.map((c) => [c.id, c]));

module.exports = sources
  .map((s) => ({
    ...s,
    url: `/sources/${s.slug}/`,
    defanged: s.domain.replace(/\./g, "[.]"),
    citedCount: (s.cited_in || []).length,
    claims: (s.cited_in || []).map((id) => byId.get(id)).filter(Boolean),
    citedBy: [
      ...new Set(
        (s.cited_in || [])
          .map((id) => byId.get(id))
          .filter(Boolean)
          .flatMap((c) => c.observations.filter((o) => (o.cited_domains || []).includes(s.domain)).map((o) => o.chatbot))
      )
    ].sort(),
    complaintStatus: (s.complaints || []).map((c) => c.status).pop() || null
  }))
  .sort((a, b) => b.citedCount - a.citedCount || a.domain.localeCompare(b.domain));
