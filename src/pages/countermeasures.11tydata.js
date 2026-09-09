module.exports = {
  eleventyComputed: {
    figures: (data) => ({
      total: data.countermeasures.total,
      answered: data.countermeasures.answered,
      median: data.countermeasures.medianResponseDays
        ? `, median response time ${data.countermeasures.medianResponseDays} days`
        : ""
    }),
    // Grouped by what a table shows, so a re-measurement gets its own chip
    // instead of inflating the disclosure count (Countermeasures Catalogue
    // §2.1, Countries Index Business Logic §12).
    actionTypes: (data) =>
      data.countermeasures.types.filter((t) => t.count).sort((a, b) => b.count - a.count),
    dataset: (data) => ({
      name: "Citere countermeasures log",
      description:
        "Public log of reports to platforms and registrars, data shared with partners, and re-measurements, with dates and response status.",
      keywords: ["countermeasures log", "responsible disclosure", "AI chatbots", "disinformation"]
    })
  }
};
