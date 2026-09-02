// The public escalation log: fact, date and status only, never correspondence.
const { readJson } = require("../_lib/markdown.cjs");

const raw = readJson("data/escalations.json");
const actions = (raw.actions || [])
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

module.exports = {
  actions,
  total: raw.total !== undefined ? raw.total : actions.length,
  answered: raw.answered,
  medianResponseDays: raw.median_response_days
};
