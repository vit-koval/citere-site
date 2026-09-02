const { fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    title: "Domains cited by AI chatbots, by network",
    description: (data) =>
      fitDescription(
        [
          `The ${data.sources.length} domains from Russian influence networks that we have recorded in public AI chatbot answers,`,
          "with the published attribution for each one.",
          "Download as CSV or STIX 2.1 under CC BY 4.0."
        ],
        "/sources/"
      ),
    dataset: (data) => ({
      name: "Sitera domain watchlist",
      description:
        "Public subset of the domains attributed to Russian influence networks that Sitera has recorded in AI chatbot citations.",
      keywords: ["domain watchlist", "STIX", "Russian influence operations", "AI chatbots"],
      distribution: data.datasets.all
        .filter((d) => d.key.startsWith("sources"))
        .map((d) => ({
          "@type": "DataDownload",
          encodingFormat: d.format,
          contentUrl: `https://${data.site.domain}${d.url}`
        }))
    }),
    pageExports: (data) => data.datasets.all.filter((d) => d.key.startsWith("sources")).map((d) => ({ label: d.format, url: d.url }))
  }
};
