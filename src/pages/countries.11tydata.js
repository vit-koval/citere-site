module.exports = {
  eleventyComputed: {
    breadcrumbTrail: () => [
      { title: "Home", url: "/" },
      { title: "Benchmarks", url: "/benchmarks/" },
      { title: "Countries", url: "/countries/" }
    ]
  }
};
