// Human-written prose from content/{lang}/. Never contains numbers.
const { loadDir } = require("../_lib/markdown.cjs");

module.exports = {
  en: loadDir("content/en"),
  uk: loadDir("content/uk")
};
