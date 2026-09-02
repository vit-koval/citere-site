// Published exports. Like navigation, an entry appears only once the template
// that writes the file exists, so /data/ never advertises a missing download.
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("../_lib/markdown.cjs");

const built = (template) => fs.existsSync(path.join(ROOT, "src", template));

const ENTRIES = [
  {
    key: "registry-json",
    name: "Claim registry (JSON)",
    description: "One record per documented false claim, with observations, actions and before/after measurements.",
    format: "JSON",
    url: "/registry.json",
    template: "machine/registry-json.njk"
  },
  {
    key: "registry-csv",
    name: "Observations (CSV)",
    description: "One row per chatbot answer: claim, chatbot, country, language, persona, date, model version, behaviour.",
    format: "CSV",
    url: "/registry.csv",
    template: "machine/registry-csv.njk"
  },
  {
    key: "sources-csv",
    name: "Domain watchlist (CSV)",
    description: "Public subset of the domains we match chatbot citations against, with network and attribution.",
    format: "CSV",
    url: "/sources.csv",
    template: "machine/sources-csv.njk"
  },
  {
    key: "sources-stix",
    name: "Domain watchlist (STIX 2.1)",
    description: "The same watchlist as a STIX 2.1 bundle, one indicator per domain, for CERT, MISP and OpenCTI.",
    format: "STIX 2.1",
    url: "/sources.stix.json",
    template: "machine/sources-stix.njk"
  },
  {
    key: "escalations-csv",
    name: "Escalation log (CSV)",
    description: "Every report we sent, to whom, on what date, and the status of the response.",
    format: "CSV",
    url: "/escalations.csv",
    template: "machine/escalations-csv.njk"
  }
];

const live = ENTRIES.filter((e) => built(e.template)).map((e) => ({ ...e, shared: true }));

module.exports = {
  all: live,
  has: Object.fromEntries(ENTRIES.map((e) => [e.key, built(e.template)])),
  byKey: Object.fromEntries(live.map((e) => [e.key, e]))
};
