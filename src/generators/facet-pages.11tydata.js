const meta = require("../_lib/meta-strings.cjs");
const ui = require("../_data/ui.js");

const t = (lang, key) => ((ui[lang] || ui.en)[key] ?? ui.en[key]);

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    facet: (data) => data.entry.item,
    facetHeading: (data) => meta.facet(data.entry.item, data.entry.lang).heading,
    facetIntro: (data) => meta.facet(data.entry.item, data.entry.lang).intro,
    title: (data) => meta.facet(data.entry.item, data.entry.lang).title,
    description: (data) => meta.facet(data.entry.item, data.entry.lang).description,
    updated: (data) => data.entry.item.updated,
    collectionItems: (data) => data.entry.item.claims.map((c) => ({ url: c.url, title: c.title_en })),
    breadcrumbTrail: (data) => [
      { title: t(data.entry.lang, "crumb.home"), url: "/" },
      { title: t(data.entry.lang, "crumb.registry"), url: "/registry/" },
      { title: data.entry.item.label, url: data.entry.item.url }
    ]
  }
};
