module.exports = {
  eleventyComputed: {
    // The Benchmarks page is a shell until the issue is specified
    // (CLAUDE_CODE_BRIEF §4). It advertises itself as a Dataset because the
    // figures it does publish are real and exportable.
    dataset: (data) => ({
      name: "Citere benchmarks",
      description:
        `Escalation matrix and grain-of-truth split for ${data.benchmarks.marketName}, ${data.benchmarks.label}, at the news-style question, with one issue per cluster per month.`,
      keywords: ["AI chatbots", "disinformation", "benchmark", "grain of truth", "escalation tiers"],
      temporalCoverage: data.benchmarks.reference ? data.benchmarks.reference.collected_at : undefined
    })
  }
};
