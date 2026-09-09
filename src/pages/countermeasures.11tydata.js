module.exports = {
  eleventyComputed: {
    figures: (data) => ({
      total: data.countermeasures.total,
      answered: data.countermeasures.answered,
      median: data.countermeasures.medianResponseDays
        ? `, median response time ${data.countermeasures.medianResponseDays} days`
        : ""
    }),
    actionTypes: (data) => {
      const counts = new Map();
      for (const a of data.countermeasures.actions) counts.set(a.type, (counts.get(a.type) || 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count }));
    },
    dataset: (data) => ({
      name: "Citere countermeasures log",
      description:
        "Public log of reports to platforms and registrars, data shared with partners, and re-measurements, with dates and response status.",
      keywords: ["countermeasures log", "responsible disclosure", "AI chatbots", "disinformation"]
    })
  }
};
