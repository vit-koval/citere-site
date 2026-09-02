// The public domain watchlist. Domains are printed defanged and never linked.
const { readJson } = require("../_lib/markdown.cjs");
const claims = require("./claims.js");

const raw = readJson("data/sources.json");
const byId = new Map(claims.map((c) => [c.id, c]));

module.exports = (raw.domains || [])
  .map((s) => ({
    ...s,
    url: `/sources/${s.slug}/`,
    defanged: s.domain.replace(/\./g, "[.]"),
    citedCount: s.citations !== undefined ? s.citations : (s.cited_in || []).length,
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

module.exports.version = raw.version;
module.exports.updated = raw.updated;
