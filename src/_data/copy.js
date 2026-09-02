// Human-written prose from content/{lang}/. Never contains numbers.
const { loadDir } = require("../_lib/markdown.cjs");

const lang = (code) => ({
  ...loadDir(`content/${code}`),
  reports: loadDir(`content/${code}/reports`)
});

module.exports = {
  en: lang("en"),
  uk: lang("uk")
};
