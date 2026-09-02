// Everything that is not a claim page or a facet of the registry.
module.exports = {
  eleventyComputed: {
    sitemapPages: (data) => {
      const entries = [
        { url: "/", lastmod: data.site.last_update },
        { url: "/registry/", lastmod: data.site.last_update },
        { url: "/methodology/", lastmod: data.site.last_update },
        { url: "/about/", lastmod: data.site.last_update },
        { url: "/data/", lastmod: data.site.last_update },
        { url: "/sources/", lastmod: data.site.last_update },
        { url: "/escalations/", lastmod: data.site.last_update },
        { url: "/monitor/", lastmod: data.site.last_update },
        { url: "/platforms/", lastmod: data.site.last_update }
      ];
      for (const report of data.reports) {
        entries.push({ url: `/monitor/${report.slug}/`, lastmod: report.date });
      }
      for (const profile of data.profiles.chatbots) {
        entries.push({ url: profile.url, lastmod: data.site.last_update });
      }
      for (const profile of data.profiles.countries) {
        entries.push({ url: profile.url, lastmod: data.site.last_update });
      }
      for (const source of data.sources) {
        entries.push({ url: source.url, lastmod: data.site.last_update });
      }
      return entries;
    }
  }
};
