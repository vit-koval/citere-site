const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    title: (data) => fitTitle(`Russian disinformation in AI chatbots: ${data.profile.name} — Citere`),
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
    articleHeadline: (data) => `Russian disinformation in AI chatbots: ${data.profile.name}`,
    articlePublished: (data) => data.site.last_update,
    articleModified: (data) => data.site.last_update,
    dataset: (data) => ({
      name: `Citere observations: ${data.profile.name}`,
      description: `Recorded chatbot answers served to users in ${data.profile.name}.`,
      spatialCoverage: data.profile.key.toUpperCase(),
      keywords: ["AI chatbots", "disinformation", "Ukraine", data.profile.name]
    }),
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Countries", url: "/countries/" },
      { title: data.profile.name, url: data.profile.url }
    ]
  }
};
