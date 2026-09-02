module.exports = {
  eleventyComputed: {
    // The citation string carries the release version, so it comes from data.
    figures: (data) => ({
      year: String(data.site.last_update).slice(0, 4),
      version: data.site.watchlist_version
    })
  }
};
