const meta = require("../_lib/meta-strings.cjs");
const ui = require("../_data/ui.js");

const t = (lang, key) => ((ui[lang] || ui.en)[key] ?? ui.en[key]);

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    profile: (data) => data.entry.item,
    title: (data) => meta.platform(data.entry.item, data.entry.lang).title,
    description: (data) => meta.platform(data.entry.item, data.entry.lang).description,
    platformHeading: (data) => meta.platform(data.entry.item, data.entry.lang).heading,
    articleHeadline: (data) => meta.platform(data.entry.item, data.entry.lang).heading,
    articlePublished: (data) => data.site.last_update,
    articleModified: (data) => data.site.last_update,
    dataset: (data) => ({
      name: `Sitera observations: ${data.entry.item.name}`,
      description: `Recorded answers from ${data.entry.item.name}, one row per answer, with persona, country and behaviour.`,
      spatialCoverage: data.entry.item.stats.countries.map((c) => c.toUpperCase()).join(", ") || undefined,
      keywords: [data.entry.item.name, "AI chatbots", "disinformation", "Ukraine"],
      distribution: (data.datasets.all || [])
        .filter((d) => d.key === "registry-csv")
        .map((d) => ({ "@type": "DataDownload", encodingFormat: d.format, contentUrl: `https://${data.site.domain}${d.url}` }))
    }),
    pageExports: (data) =>
      (data.datasets.all || []).filter((d) => d.key === "registry-csv").map((d) => ({ label: d.format, url: d.url })),
    breadcrumbTrail: (data) => [
      { title: t(data.entry.lang, "crumb.home"), url: "/" },
      { title: t(data.entry.lang, "crumb.chatbots"), url: "/platforms/" },
      { title: data.entry.item.name, url: data.entry.item.url }
    ]
  }
};
