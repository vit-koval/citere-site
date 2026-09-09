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
    // Brief §4: sorted by critical desc, then repeats desc.
    registryClaims: (data) =>
      [...data.claims].sort((a, b) =>
        b.counts.critical - a.counts.critical ||
        b.counts.repeated - a.counts.repeated ||
        String(a.id).localeCompare(String(b.id))),
    // Five tiles, all counts: nothing here is a rate, so nothing needs a
    // persona attached.
    registryTiles: (data) => {
      const claims = data.claims;
      const tested = claims.filter((c) => c.tested);
      return [
        { value: new Set(claims.map((c) => String(c.cluster))).size, label: "clusters" },
        { value: claims.length, label: "claims catalogued" },
        { value: tested.length, label: "tested in at least one market" },
        { value: tested.reduce((n, c) => n + c.counts.critical, 0), label: "critical incidents", tone: "bad" },
        { value: data.metrics.dimensions.markets.length, label: "markets with a run" }
      ];
    },
    dataset: (data) => ({
      name: "Citere claim registry",
      description:
        "Documented false claims about Ukraine found in public AI chatbot answers, with per-cell metrics, countermeasures and re-measurements.",
      keywords: ["disinformation", "AI chatbots", "Ukraine", "fact-checking", "Russian influence operations"],
      spatialCoverage:
        [...new Set(data.claims.flatMap((c) => c.countries))].map((c) => c.toUpperCase()).join(", ") || undefined
    })
  }
};
