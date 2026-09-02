module.exports = {
  eleventyComputed: {
    dataset: (data) => ({
      name: "Sitera escalation log",
      description:
        "Public log of reports to platforms and registrars, data shared with partners, and re-measurements, with dates and response status.",
      keywords: ["escalation log", "responsible disclosure", "AI chatbots", "disinformation"],
      distribution: data.datasets.all
        .filter((d) => d.key.startsWith("escalations"))
        .map((d) => ({
          "@type": "DataDownload",
          encodingFormat: d.format,
          contentUrl: `https://${data.site.domain}${d.url}`
        }))
    }),
    pageExports: (data) => data.datasets.all.filter((d) => d.key.startsWith("escalations")).map((d) => ({ label: d.format, url: d.url }))
  }
};
