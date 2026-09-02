const { readJson } = require("../_lib/markdown.cjs");

const sources = readJson("data/sources.json");

module.exports = sources
  .map((s) => ({
    ...s,
    url: `/sources/${s.slug}/`,
    defanged: s.domain.replace(/\./g, "[.]"),
    citedCount: (s.cited_in || []).length,
    complaintStatus: (s.complaints || []).map((c) => c.status).pop() || null
  }))
  .sort((a, b) => b.citedCount - a.citedCount || a.domain.localeCompare(b.domain));
