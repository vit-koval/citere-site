module.exports = {
  eleventyComputed: {
    figures: (data) => ({ run: data.benchmarks.label || data.benchmarks.run || "current" }),
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Benchmarks", url: "/benchmarks/" },
      { title: "Chatbots", url: "/platforms/" }
    ]
  }
};
