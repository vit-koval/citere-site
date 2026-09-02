module.exports = {
  eleventyComputed: {
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
