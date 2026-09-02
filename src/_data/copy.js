// Human-written prose from content/en/. Never contains numbers: where a
// sentence needs one it writes {{ name }} and the template fills it from data/.
// The Ukrainian tree arrives with the mirror at build step 9.
const { loadDir } = require("../_lib/markdown.cjs");

module.exports = {
  en: {
    ...loadDir("content/en"),
    claims: loadDir("content/en/claims"),
    reports: loadDir("content/en/reports")
  }
};
