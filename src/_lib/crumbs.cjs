// Breadcrumb labels for generated pages, in the page's language.
const ui = require("../_data/ui.js");
const t = (lang, key) => ((ui[lang] || ui.en)[key] ?? ui.en[key]);
const home = (lang) => ({ title: t(lang, "crumb.home"), url: "/" });
const crumb = (lang, key, url) => ({ title: t(lang, key), url });
module.exports = { t, home, crumb };
