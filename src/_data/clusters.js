// Normalised to {id: {name_en}} so templates address a cluster by its id.
const { readJson } = require("../_lib/markdown.cjs");

const raw = readJson("data/clusters.json");
module.exports = Object.fromEntries(
  (raw.clusters || []).map((c) => [c.id, { name_en: c.label_en, name_uk: c.label_uk }])
);
