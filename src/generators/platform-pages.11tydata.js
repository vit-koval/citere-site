const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    title: (data) => fitTitle(`${data.profile.name} and Russian disinformation on Ukraine — Citere`),
    description: (data) => {
      const p = data.profile;
      const pct = (v) => `${Math.round((v || 0) * 1000) / 10}%`;
      return fitDescription(
        [
          `How ${p.name} (${p.company}) handled documented false claims about Ukraine:`,
          `${pct(p.repeatRate)} repeat-rate on the topical-news persona,`,
          `${pct(p.contaminationRate)} of answers cited a watchlisted domain.`,
          "Per persona and per market."
        ],
        p.url
      );
    },
    articleHeadline: (data) => `How ${data.profile.name} handles Russian disinformation about Ukraine`,
    articlePublished: (data) => data.site.last_update,
    articleModified: (data) => data.site.last_update,
    dataset: (data) => ({
      name: `Citere observations: ${data.profile.name}`,
      description: `Recorded answers from ${data.profile.name}, per persona and per market.`,
      keywords: [data.profile.name, "AI chatbots", "disinformation", "Ukraine"]
    }),
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Chatbots", url: "/platforms/" },
      { title: data.profile.name, url: data.profile.url }
    ]
  }
};
