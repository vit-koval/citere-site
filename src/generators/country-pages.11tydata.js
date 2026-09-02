const meta = require("../_lib/meta-strings.cjs");
const ui = require("../_data/ui.js");

const t = (lang, key) => ((ui[lang] || ui.en)[key] ?? ui.en[key]);

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    profile: (data) => data.entry.item,
    countryName: (data) => meta.country(data.entry.item, data.entry.lang).name,
    countryHeading: (data) => meta.country(data.entry.item, data.entry.lang).heading,
    prose: (data) => {
      const key = data.entry.item.key;
      const copy = data.copy || {};
      const localised = copy[data.entry.lang] && copy[data.entry.lang].countries;
      return (localised && localised[key]) || (copy.en.countries || {})[key];
    },
    translationMissing: (data) => {
      const copy = data.copy || {};
      const localised = copy[data.entry.lang] && copy[data.entry.lang].countries;
      return !(localised && localised[data.entry.item.key]);
    },
    title: (data) => meta.country(data.entry.item, data.entry.lang).title,
    description: (data) => meta.country(data.entry.item, data.entry.lang).description,
    articleHeadline: (data) => meta.country(data.entry.item, data.entry.lang).heading,
    articlePublished: (data) => data.site.last_update,
    articleModified: (data) => data.site.last_update,
    dataset: (data) => ({
      name: `Sitera observations: ${meta.country(data.entry.item, "en").name}`,
      description: `Recorded chatbot answers served to users in ${meta.country(data.entry.item, "en").name}, one row per answer.`,
      spatialCoverage: data.entry.item.key.toUpperCase(),
      keywords: ["AI chatbots", "disinformation", "Ukraine"],
      distribution: (data.datasets.all || [])
        .filter((d) => d.key === "registry-csv")
        .map((d) => ({ "@type": "DataDownload", encodingFormat: d.format, contentUrl: `https://${data.site.domain}${d.url}` }))
    }),
    pageExports: (data) =>
      (data.datasets.all || []).filter((d) => d.key === "registry-csv").map((d) => ({ label: d.format, url: d.url })),
    breadcrumbTrail: (data) => [
      { title: t(data.entry.lang, "crumb.home"), url: "/" },
      { title: t(data.entry.lang, "crumb.registry"), url: "/registry/" },
      { title: meta.country(data.entry.item, data.entry.lang).name, url: data.entry.item.url }
    ]
  }
};
