// Nav and footer entries. A link appears only once the template that produces
// its page exists, so no step of the build order can ship a dead link or a
// "coming soon" placeholder (CLAUDE.md section 11.7).
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("../_lib/markdown.cjs");

const built = (template) => fs.existsSync(path.join(ROOT, "src", template));

const ENTRIES = [
  { key: "registry", label: { en: "Registry", uk: "Реєстр" }, url: "/registry/", template: "pages/registry.njk", menu: true },
  { key: "reports", label: { en: "Reports", uk: "Звіти" }, url: "/monitor/", template: "pages/monitor.njk", menu: true },
  { key: "chatbots", label: { en: "Chatbots", uk: "Чат-боти" }, url: "/platforms/", template: "pages/platforms.njk", menu: true },
  { key: "sources", label: { en: "Sources", uk: "Джерела" }, url: "/sources/", template: "pages/sources.njk", menu: true },
  { key: "escalations", label: { en: "Escalations", uk: "Ескалації" }, url: "/escalations/", template: "pages/escalations.njk", menu: true },
  { key: "methodology", label: { en: "Methodology", uk: "Методологія" }, url: "/methodology/", template: "pages/methodology.njk", menu: true },
  { key: "data", label: { en: "Data", uk: "Дані" }, url: "/data/", template: "pages/data.njk", menu: false },
  { key: "about", label: { en: "About", uk: "Про нас" }, url: "/about/", template: "pages/about.njk", menu: true },
  { key: "corrections", label: { en: "Corrections", uk: "Виправлення" }, url: "/about/#corrections", template: "pages/about.njk", menu: false },
  { key: "contact", label: { en: "Contact", uk: "Контакти" }, url: "/about/#contact", template: "pages/about.njk", menu: false },
  // Feeds and machine files are language-neutral: one copy, linked from both.
  { key: "rss", label: { en: "RSS", uk: "RSS" }, url: "/feed.xml", template: "machine/feed-xml.njk", menu: false, shared: true },
  { key: "json", label: { en: "JSON", uk: "JSON" }, url: "/registry.json", template: "machine/registry-json.njk", menu: false, shared: true },
  { key: "llms", label: { en: "llms.txt", uk: "llms.txt" }, url: "/llms.txt", template: "machine/llms.njk", menu: false, shared: true }
];

const live = ENTRIES.filter((e) => built(e.template));

module.exports = {
  byKey: Object.fromEntries(live.map((e) => [e.key, e])),
  menu: live.filter((e) => e.menu),
  footer: live,
  has: Object.fromEntries(ENTRIES.map((e) => [e.key, built(e.template)]))
};
