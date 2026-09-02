const { fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    title: "Registry of false claims in AI chatbot answers",
    description: (data) =>
      fitDescription(
        [
          `Every false claim about Ukraine we have documented in a public AI chatbot answer: ${data.claims.length} claims,`,
          `${data.site.counters.responses} recorded answers.`,
          "Verdict, evidence, sources cited and what changed after we reported it.",
          "Open data under CC BY 4.0."
        ],
        "/registry/"
      ),
    collectionItems: (data) => data.claims.map((c) => ({ url: c.url, title: c.title_en })),
    dataset: (data) => ({
      name: "Sitera claim registry",
      description:
        "Documented false claims about Ukraine found in public AI chatbot answers, with per-answer observations, escalations and re-measurements.",
      keywords: ["disinformation", "AI chatbots", "Ukraine", "fact-checking", "Russian influence operations"],
      spatialCoverage: [...new Set(data.claims.flatMap((c) => c.countries))].map((c) => c.toUpperCase()).join(", ") || undefined,
      distribution: data.datasets.all
        .filter((d) => d.key.startsWith("registry"))
        .map((d) => ({
          "@type": "DataDownload",
          encodingFormat: d.format,
          contentUrl: `https://${data.site.domain}${d.url}`
        }))
    }),
    pageExports: (data) => data.datasets.all.filter((d) => d.key.startsWith("registry")).map((d) => ({ label: d.format, url: d.url }))
  }
};
