// Everything that is not a claim page or a registry facet.
module.exports = {
  eleventyComputed: {
    sitemapPages: (data) => {
      const d = data.site.last_update;
      const entries = [
        "/", "/registry/", "/benchmarks/", "/monitor/", "/platforms/", "/countries/",
        "/sources/", "/countermeasures/", "/methodology/", "/data/", "/about/",
        "/mission/", "/manifesto/", "/press/", "/terms/", "/privacy/"
      ].map((url) => ({ url, lastmod: d }));
      for (const r of data.reports) entries.push({ url: r.url, lastmod: r.date });
      for (const p of data.profiles.chatbots) entries.push({ url: p.url, lastmod: d });
      for (const p of data.profiles.countries) entries.push({ url: p.url, lastmod: d });
      for (const s of data.sources) entries.push({ url: s.url, lastmod: d });
      for (const f of data.sourceFacets) entries.push({ url: f.url, lastmod: d });
      for (const f of data.countermeasureFacets) entries.push({ url: f.url, lastmod: d });
      return entries;
    }
  }
};
