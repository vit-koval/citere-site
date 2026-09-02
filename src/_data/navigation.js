// Nav and footer entries. A link appears only once the template that produces
// its page exists, so no step of the build order can ship a dead link or a
// "coming soon" placeholder (CLAUDE.md section 11.7).
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("../_lib/markdown.cjs");

const built = (template) => fs.existsSync(path.join(ROOT, "src", template));

const ENTRIES = [
  { key: "registry", label: "Registry", url: "/registry/", template: "pages/registry.njk", menu: true },
  { key: "reports", label: "Reports", url: "/monitor/", template: "pages/monitor.njk", menu: true },
  { key: "chatbots", label: "Chatbots", url: "/platforms/", template: "pages/platforms.njk", menu: true },
  { key: "sources", label: "Sources", url: "/sources/", template: "pages/sources.njk", menu: true },
  { key: "escalations", label: "Escalations", url: "/escalations/", template: "pages/escalations.njk", menu: true },
  { key: "methodology", label: "Methodology", url: "/methodology/", template: "pages/methodology.njk", menu: true },
  { key: "data", label: "Data", url: "/data/", template: "pages/data.njk", menu: false },
  { key: "about", label: "About", url: "/about/", template: "pages/about.njk", menu: true },
  { key: "corrections", label: "Corrections", url: "/about/#corrections", template: "pages/about.njk", menu: false },
  { key: "contact", label: "Contact", url: "/about/#contact", template: "pages/about.njk", menu: false },
  { key: "rss", label: "RSS", url: "/feed.xml", template: "machine/feed.njk", menu: false },
  { key: "json", label: "JSON", url: "/registry.json", template: "machine/registry-json.njk", menu: false },
  { key: "llms", label: "llms.txt", url: "/llms.txt", template: "machine/llms.njk", menu: false }
];

const live = ENTRIES.filter((e) => built(e.template));

module.exports = {
  byKey: Object.fromEntries(live.map((e) => [e.key, e])),
  menu: live.filter((e) => e.menu),
  footer: live,
  has: Object.fromEntries(ENTRIES.map((e) => [e.key, built(e.template)]))
};
