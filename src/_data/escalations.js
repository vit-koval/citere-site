const { readJson } = require("../_lib/markdown.cjs");

module.exports = readJson("data/escalations.json")
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
