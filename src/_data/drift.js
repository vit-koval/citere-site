// Citation drift: the share of an assistant's cited domains that changes from
// one month to the next, independent of anything we or the platform do.
//
// This is an external, published figure, not a Citere measurement. It exists
// so that no between-run change is read on its own: a significant delta sits on
// top of a source set that would have reshuffled anyway.
const { readJson } = require("../_lib/markdown.cjs");

const raw = readJson("data/citation-drift.json") || { products: [] };
const products = raw.products || [];
const rates = products.map((p) => p.rate);

module.exports = {
  ...raw,
  products,
  byKey: Object.fromEntries(products.filter((p) => p.key).map((p) => [p.key, p])),
  min: rates.length ? Math.min(...rates) : null,
  max: rates.length ? Math.max(...rates) : null
};
