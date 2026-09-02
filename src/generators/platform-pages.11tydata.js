const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    title: (data) => fitTitle(`${data.profile.name} and Russian disinformation on Ukraine`),
    description: (data) => {
      const p = data.profile;
      return fitDescription(
        [
          `How ${p.name} (${p.company}) handled documented false claims about Ukraine:`,
          `${p.stats.repeated} of ${p.stats.nonEvasive} non-evasive answers repeated one,`,
          `${p.stats.contaminated} cited a watchlisted domain.`,
          "Per persona, with model versions."
        ],
        p.url
      );
    },
    articleHeadline: (data) => `How ${data.profile.name} handles Russian disinformation about Ukraine`,
    articlePublished: (data) => data.site.last_update,
    articleModified: (data) => data.site.last_update,
    dataset: (data) => ({
      name: `Sitera observations: ${data.profile.name}`,
      description: `Recorded answers from ${data.profile.name}, one row per answer, with persona, country and behaviour.`,
      spatialCoverage: data.profile.stats.countries.map((c) => c.toUpperCase()).join(", ") || undefined,
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
      { title: "Chatbots", url: "/platforms/" },
      { title: data.profile.name, url: data.profile.url }
    ]
  }
};
