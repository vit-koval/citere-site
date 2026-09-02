const meta = require("../_lib/meta-strings.cjs");
const ui = require("../_data/ui.js");

const t = (lang, key) => ((ui[lang] || ui.en)[key] ?? ui.en[key]);

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    source: (data) => data.entry.item,
    title: (data) => meta.source(data.entry.item, data.entry.lang).title,
    description: (data) => meta.source(data.entry.item, data.entry.lang).description,
    updated: (data) => data.site.last_update,
    breadcrumbTrail: (data) => [
      { title: t(data.entry.lang, "crumb.home"), url: "/" },
      { title: t(data.entry.lang, "crumb.sources"), url: "/sources/" },
      { title: data.entry.item.defanged, url: data.entry.item.url }
    ]
  }
};
