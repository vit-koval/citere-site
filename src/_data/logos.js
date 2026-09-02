const { readJson } = require("../_lib/markdown.cjs");

const logos = readJson("data/logos.json");

// Nunjucks' selectattr/equalto does not filter here, so the macro looks an
// assistant up by key directly.
module.exports = {
  ...logos,
  byKey: Object.fromEntries((logos.assistants || []).map((a) => [a.key, a]))
};
