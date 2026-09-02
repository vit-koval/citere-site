const { fitTitle, fitDescription } = require("../_lib/meta.cjs");
const runs = require("../_data/runs.js");
const copy = require("../_data/copy.js");

// Recomputed across the report's runs from the raw observations, never by
// adding pre-aggregated rows together.
const statsFor = (report) => runs.summariseRuns(report.runs);

module.exports = {
  eleventyComputed: {
    stats: (data) => statsFor(data.report),
    prose: (data) => copy.en.reports[data.report.slug],
    title: (data) => fitTitle(`Monitor ${data.report.period}: AI chatbots on Ukraine`),
    description: (data) => {
      const s = statsFor(data.report);
      return fitDescription(
        [
          `Sitera monitor ${data.report.period}:`,
          `${s.answers} answers from ${s.chatbots.length} public AI chatbots in ${s.countries.length} countries,`,
          "scored per persona for repeating documented false claims about Ukraine.",
          "Open data, CC BY 4.0."
        ],
        `/monitor/${data.report.slug}/`
      );
    },
    articleHeadline: (data) => data.report.title_en,
    articlePublished: (data) => data.report.date,
    articleModified: (data) => data.report.date,
    updated: (data) => data.report.date,
    dataset: (data) => {
      const s = statsFor(data.report);
      return {
        name: `Sitera monitor ${data.report.period}`,
        description: `Chatbot answers recorded for the ${data.report.period} Sitera run, one row per answer.`,
        temporalCoverage: s.firstDate && s.lastDate ? `${s.firstDate}/${s.lastDate}` : undefined,
        spatialCoverage: s.countries.map((c) => c.toUpperCase()).join(", ") || undefined,
        keywords: ["AI chatbots", "disinformation", "Ukraine", "monitoring"],
        distribution: (data.datasets.all || [])
          .filter((d) => d.key === "registry-csv" || d.key === "registry-json")
          .map((d) => ({
            "@type": "DataDownload",
            encodingFormat: d.format,
            contentUrl: `https://${data.site.domain}${d.url}`
          }))
      };
    },
    reportDownloads: (data) => {
      const out = (data.datasets.all || [])
        .filter((d) => d.key === "registry-csv" || d.key === "registry-json")
        .map((d) => ({ label: `Observations as ${d.format}`, url: d.url }));
      if (data.report.pdf_url) out.push({ label: "Report as PDF", url: data.report.pdf_url });
      return out;
    },
    pageExports: (data) =>
      (data.datasets.all || [])
        .filter((d) => d.key === "registry-csv")
        .map((d) => ({ label: d.format, url: d.url })),
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Reports", url: "/monitor/" },
      { title: data.report.period, url: `/monitor/${data.report.slug}/` }
    ]
  }
};
