const MONTHS = require("../_lib/labels.cjs").MONTHS;
const displayDate = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
};

module.exports = {
  eleventyComputed: {
    figures: (data) => ({
      claims: `${data.claims.length} ${data.claims.length === 1 ? "claim" : "claims"}`,
      updated: displayDate(data.site.last_update)
    }),
    collectionItems: (data) => data.claims.map((c) => ({ url: c.url, title: c.title_en })),
    dataset: (data) => ({
      name: "Citere claim registry",
      description:
        "Documented false claims about Ukraine found in public AI chatbot answers, with per-answer observations, escalations and re-measurements.",
      keywords: ["disinformation", "AI chatbots", "Ukraine", "fact-checking", "Russian influence operations"],
      spatialCoverage:
        [...new Set(data.claims.flatMap((c) => c.countries))].map((c) => c.toUpperCase()).join(", ") || undefined
    })
  }
};
