module.exports = {
  eleventyComputed: {
    figures: (data) => ({
      total: data.escalations.total,
      answered: data.escalations.answered,
      median: data.escalations.medianResponseDays
        ? `, median response time ${data.escalations.medianResponseDays} days`
        : ""
    }),
    actionTypes: (data) => {
      const counts = new Map();
      for (const a of data.escalations.actions) counts.set(a.type, (counts.get(a.type) || 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count }));
    },
    dataset: (data) => ({
      name: "Citere escalation log",
      description:
        "Public log of reports to platforms and registrars, data shared with partners, and re-measurements, with dates and response status.",
      keywords: ["escalation log", "responsible disclosure", "AI chatbots", "disinformation"]
    })
  }
};
