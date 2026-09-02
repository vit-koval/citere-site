const { readJson } = require("../_lib/markdown.cjs");

module.exports = (readJson("data/reports.json").reports || [])
  .map((r) => ({ ...r, title_en: r.title_en || r.title, url: `/monitor/${r.slug}/` }))
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
