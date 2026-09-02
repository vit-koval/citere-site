const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("../_lib/markdown.cjs");

// The Ukrainian mirror is build step 8. Until content/uk carries pages, the site
// advertises only English in hreflang rather than pointing at URLs that 404.
const ukEnabled = fs.existsSync(path.join(ROOT, "content/uk/index.md"));

module.exports = { ukEnabled, languages: ukEnabled ? ["en", "uk"] : ["en"] };
