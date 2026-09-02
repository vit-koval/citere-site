// The nav and footer link sets from design-mockup/, in the mockup's order.
// A link renders only once the template that produces its page exists, so no
// step of the build order can ship a dead link (CLAUDE.md 10, 11.6).
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("../_lib/markdown.cjs");

const built = (template) => template === null || fs.existsSync(path.join(ROOT, "src", template));

const P = {
  registry: "pages/registry.njk",
  benchmarks: "pages/benchmarks.njk",
  reports: "pages/monitor.njk",
  chatbots: "pages/platforms.njk",
  countries: "pages/countries.njk",
  sources: "pages/sources.njk",
  escalations: "pages/escalations.njk",
  methodology: "pages/methodology.njk",
  data: "pages/data.njk",
  about: "pages/about.njk",
  mission: "pages/mission.njk",
  manifesto: "pages/manifesto.njk",
  press: "pages/press.njk",
  terms: "pages/terms.njk",
  privacy: "pages/privacy.njk",
  feed: "machine/feed-xml.njk",
  feedJson: "machine/feed-json.njk",
  llms: "machine/llms.njk",
  security: "machine/security.njk"
};

const entry = (key, label, url, template) => ({ key, label, url, template });

const MAIN = [
  entry("registry", "Registry", "/registry/", P.registry),
  entry("benchmarks", "Benchmarks", "/benchmarks/", P.benchmarks),
  entry("reports", "Reports", "/monitor/", P.reports),
  entry("chatbots", "Chatbots", "/platforms/", P.chatbots),
  entry("sources", "Sources", "/sources/", P.sources),
  entry("escalations", "Escalations", "/escalations/", P.escalations),
  entry("methodology", "Methodology", "/methodology/", P.methodology)
];

const FOOTER = [
  {
    heading: "Monitoring",
    links: [
      entry("registry", "Claim registry", "/registry/", P.registry),
      entry("benchmarks", "Benchmarks", "/benchmarks/", P.benchmarks),
      entry("reports", "Reports", "/monitor/", P.reports),
      entry("chatbots", "Chatbots", "/platforms/", P.chatbots),
      entry("countries", "Countries", "/countries/", P.countries),
      entry("sources", "Sources", "/sources/", P.sources),
      entry("escalations", "Escalation log", "/escalations/", P.escalations)
    ]
  },
  {
    heading: "Method &amp; data",
    links: [
      entry("methodology", "Methodology", "/methodology/", P.methodology),
      entry("data", "Data &amp; downloads", "/data/", P.data),
      entry("cite", "How to cite", "/data/#cite", P.data),
      entry("rss", "RSS", "/feed.xml", P.feed),
      entry("jsonfeed", "JSON Feed", "/feed.json", P.feedJson),
      entry("llms", "llms.txt", "/llms.txt", P.llms)
    ]
  },
  {
    heading: "Organisation",
    links: [
      entry("about", "About", "/about/", P.about),
      entry("mission", "Mission", "/mission/", P.mission),
      entry("manifesto", "Manifesto", "/manifesto/", P.manifesto),
      entry("press", "Press &amp; Media", "/press/", P.press),
      entry("corrections", "Corrections", "/about/#corrections", P.about),
      entry("contact", "Contact", "/about/#contact", P.about)
    ]
  }
];

const LEGAL = [
  entry("terms", "Terms", "/terms/", P.terms),
  entry("privacy", "Privacy", "/privacy/", P.privacy),
  entry("press", "Press &amp; Media", "/press/", P.press),
  entry("security", "security.txt", "/.well-known/security.txt", P.security)
];

const live = (list) => list.filter((item) => built(item.template));

module.exports = {
  main: live(MAIN),
  footer: FOOTER.map((col) => ({ ...col, links: live(col.links) })).filter((col) => col.links.length),
  legal: live(LEGAL),
  has: Object.fromEntries(
    [...MAIN, ...FOOTER.flatMap((c) => c.links), ...LEGAL].map((i) => [i.key, built(i.template)])
  )
};
