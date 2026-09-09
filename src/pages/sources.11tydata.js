module.exports = {
  eleventyComputed: {
    figures: (data) => ({
      domains: `${data.sources.length} ${data.sources.length === 1 ? "domain" : "domains"}`,
      version: data.sources.version || data.site.watchlist_version,
      updated: data.sources.updated || data.site.last_update
    }),
    networkList: (data) => [...new Set(data.sources.map((s) => s.network))],
    sourceTiles: (data) => {
      const list = data.sources;
      return [
        { value: list.length, label: "domains on the watchlist" },
        { value: list.filter((s) => s.citedCount).length, label: "cited at least once" },
        { value: list.reduce((n, s) => n + s.citedCount, 0), label: "answers citing a listed domain" },
        { value: list.reduce((n, s) => n + s.injectionCount, 0), label: "source-to-answer lines" },
        { value: list.reduce((n, s) => n + s.criticalCount, 0), label: "critical incidents", tone: "bad" }
      ];
    },
    articleEvidence: (data) =>
      data.sources.flatMap((s) => (s.article_evidence || []).map((a) => ({ ...a, domain: s.domain }))),
    dataset: (data) => ({
      name: "Citere domain watchlist",
      description:
        "Public subset of the domains attributed to Russian influence networks that Citere has recorded in AI chatbot citations.",
      keywords: ["domain watchlist", "STIX", "Russian influence operations", "AI chatbots"]
    })
  }
};
