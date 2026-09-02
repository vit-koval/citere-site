const meta = require("../_lib/meta-strings.cjs");
const runs = require("../_data/runs.js");
const ui = require("../_data/ui.js");

const t = (lang, key) => ((ui[lang] || ui.en)[key] ?? ui.en[key]);
// Recomputed across the report's runs from the raw observations, never by
// adding pre-aggregated rows together.
const statsFor = (report) => runs.summariseRuns(report.runs);

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    report: (data) => data.entry.item,
    stats: (data) => statsFor(data.entry.item),
    prose: (data) => {
      const copy = data.copy || {};
      const localised = copy[data.entry.lang] && copy[data.entry.lang].reports;
      return (localised && localised[data.entry.item.slug]) || copy.en.reports[data.entry.item.slug];
    },
    translationMissing: (data) => {
      const copy = data.copy || {};
      const localised = copy[data.entry.lang] && copy[data.entry.lang].reports;
      return !(localised && localised[data.entry.item.slug]);
    },
    title: (data) => meta.report(data.entry.item, statsFor(data.entry.item), data.entry.lang).title,
    description: (data) => meta.report(data.entry.item, statsFor(data.entry.item), data.entry.lang).description,
    articleHeadline: (data) => data.entry.item.title_en,
    articlePublished: (data) => data.entry.item.date,
    articleModified: (data) => data.entry.item.date,
    updated: (data) => data.entry.item.date,
    dataset: (data) => {
      const s = statsFor(data.entry.item);
      return {
        name: `Sitera monitor ${data.entry.item.period}`,
        description: `Chatbot answers recorded for the ${data.entry.item.period} Sitera run, one row per answer.`,
        temporalCoverage: s.firstDate && s.lastDate ? `${s.firstDate}/${s.lastDate}` : undefined,
        spatialCoverage: s.countries.map((c) => c.toUpperCase()).join(", ") || undefined,
        keywords: ["AI chatbots", "disinformation", "Ukraine", "monitoring"],
        distribution: (data.datasets.all || [])
          .filter((d) => d.key === "registry-csv" || d.key === "registry-json")
          .map((d) => ({ "@type": "DataDownload", encodingFormat: d.format, contentUrl: `https://${data.site.domain}${d.url}` }))
      };
    },
    reportDownloads: (data) => {
      const out = (data.datasets.all || [])
        .filter((d) => d.key === "registry-csv" || d.key === "registry-json")
        .map((d) => ({ label: t(data.entry.lang, "misc.observationsAs").replace("%s", d.format), url: d.url }));
      if (data.entry.item.pdf_url) out.push({ label: t(data.entry.lang, "misc.reportPdf"), url: data.entry.item.pdf_url });
      return out;
    },
    pageExports: (data) =>
      (data.datasets.all || []).filter((d) => d.key === "registry-csv").map((d) => ({ label: d.format, url: d.url })),
    breadcrumbTrail: (data) => [
      { title: t(data.entry.lang, "crumb.home"), url: "/" },
      { title: t(data.entry.lang, "crumb.reports"), url: "/monitor/" },
      { title: data.entry.item.period, url: `/monitor/${data.entry.item.slug}/` }
    ]
  }
};
