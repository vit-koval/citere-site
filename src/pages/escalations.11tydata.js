const { fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    title: "Escalation log: what we reported and what happened",
    description: (data) =>
      fitDescription(
        [
          `Every report Sitera sent to a platform or registrar about Russian disinformation in AI chatbot answers: ${data.escalations.length} actions,`,
          `${data.site.counters.escalations_answered} answered.`,
          "Fact, date and status only; never the correspondence.",
          "Open data under CC BY 4.0."
        ],
        "/escalations/"
      ),
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
