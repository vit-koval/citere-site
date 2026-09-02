const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    prose: (data) => data.copy.en.countries[data.profile.key],
    title: (data) => fitTitle(`Russian disinformation in AI chatbots: ${data.profile.name}`),
    description: (data) => {
      const p = data.profile;
      return fitDescription(
        [
          `What public AI chatbots told users in ${p.name} about documented false claims on Ukraine:`,
          `${p.stats.answers} recorded answers, ${p.stats.repeated} of them repeating a claim as fact.`,
          "Per chatbot and per persona, with open data."
        ],
        p.url
      );
    },
    articleHeadline: (data) => `Russian disinformation in AI chatbots: ${data.profile.name}`,
    articlePublished: (data) => data.site.last_update,
    articleModified: (data) => data.site.last_update,
    dataset: (data) => ({
      name: `Sitera observations: ${data.profile.name}`,
      description: `Recorded chatbot answers served to users in ${data.profile.name}, one row per answer.`,
      spatialCoverage: data.profile.key.toUpperCase(),
      keywords: [data.profile.name, "AI chatbots", "disinformation", "Ukraine"],
      distribution: (data.datasets.all || [])
        .filter((d) => d.key === "registry-csv")
        .map((d) => ({
          "@type": "DataDownload",
          encodingFormat: d.format,
          contentUrl: `https://${data.site.domain}${d.url}`
        }))
    }),
    pageExports: (data) =>
      (data.datasets.all || []).filter((d) => d.key === "registry-csv").map((d) => ({ label: d.format, url: d.url })),
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Registry", url: "/registry/" },
      { title: data.profile.name, url: data.profile.url }
    ]
  }
};
