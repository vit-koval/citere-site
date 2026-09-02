const { home, crumb } = require("../_lib/crumbs.cjs");
const crumbLabel = (data) => String(data.entry.item.name);
const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    profile: (data) => data.entry.item,
    title: (data) => fitTitle(`Russian disinformation in AI chatbots: ${data.entry.item.name} — Citere`),
    description: (data) => {
      const p = data.profile;
      const pct = (v) => `${Math.round((v || 0) * 1000) / 10}%`;
      return fitDescription(
        [
          `What public AI assistants told users in ${p.name} about documented false claims on Ukraine:`,
          `${p.n} recorded answers, ${pct(p.repeatRate)} repeat-rate.`,
          "Per assistant, with open data."
        ],
        p.url
      );
    },
    articleHeadline: (data) => `Russian disinformation in AI chatbots: ${data.entry.item.name}`,
    articlePublished: (data) => data.site.last_update,
    articleModified: (data) => data.site.last_update,
    dataset: (data) => ({
      name: `Citere observations: ${data.entry.item.name}`,
      description: `Recorded chatbot answers served to users in ${data.entry.item.name}.`,
      spatialCoverage: data.entry.item.key.toUpperCase(),
      keywords: ["AI chatbots", "disinformation", "Ukraine", data.entry.item.name]
    }),
    breadcrumbTrail: (data) => [
      home(data.entry.lang),
      crumb(data.entry.lang, "crumb.countries", "/countries/"),
      { title: crumbLabel(data), url: String(data.entry.item.url || data.entry.url) }
    ]
  }
};
