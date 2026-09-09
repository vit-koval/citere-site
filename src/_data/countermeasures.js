// The public countermeasures log: fact, date and status only, never the
// correspondence. One row per action, across every claim and market.
//
// Rows arrive in the pre-restructure vocabulary, so each one is normalised onto
// the twelve-type catalogue and the drafted -> closed lifecycle here. Rows that
// already speak the new vocabulary pass through untouched, which is what will
// happen once the exporter is updated (CLAUDE_CODE_BRIEF §4).
const { readJson } = require("../_lib/markdown.cjs");
const {
  COUNTERMEASURE_TYPES, COUNTERMEASURE_STATUSES, LEGACY_TYPE, LEGACY_SUBTYPE, LEGACY_STATUS
} = require("../_lib/labels.cjs");

const raw = readJson("data/countermeasures.json") || {};

function normalise(action) {
  const type = COUNTERMEASURE_TYPES[action.type] ? action.type : LEGACY_TYPE[action.type] || null;
  const status = COUNTERMEASURE_STATUSES[action.status] ? action.status : LEGACY_STATUS[action.status] || null;
  const meta = COUNTERMEASURE_STATUSES[status] || {};
  return {
    ...action,
    type,
    typeLabel: (COUNTERMEASURE_TYPES[type] || {}).label || action.type,
    typeClass: (COUNTERMEASURE_TYPES[type] || {}).cls || "",
    subtype: action.subtype || LEGACY_SUBTYPE[action.type] || null,
    status,
    statusLabel: meta.label || action.status,
    statusClass: meta.cls || "",
    // A draft is not an action taken. Every count on the site depends on this
    // line telling the truth about which is which.
    taken: meta.taken === true,
    awaitingConfirmation: status === "pending_confirmation",
    claims: action.claim_ids || (action.claim_id ? [action.claim_id] : []),
    market: action.market || null,
    legacy: { type: action.type, status: action.status }
  };
}

const actions = (raw.actions || [])
  .map(normalise)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

const count = (fn) => actions.filter(fn).length;
const byType = {};
for (const a of actions) (byType[a.type] ||= []).push(a);

module.exports = {
  actions,
  byType,
  types: Object.entries(COUNTERMEASURE_TYPES).map(([key, meta]) => ({
    key, ...meta, count: (byType[key] || []).length
  })),
  statuses: Object.entries(COUNTERMEASURE_STATUSES).map(([key, meta]) => ({
    key, ...meta, count: count((a) => a.status === key)
  })),
  targets: [...new Set(actions.map((a) => a.target).filter(Boolean))].sort(),
  markets: [...new Set(actions.map((a) => a.market).filter(Boolean))].sort(),
  totals: {
    logged: actions.length,
    taken: count((a) => a.taken),
    drafted: count((a) => a.status === "drafted"),
    awaitingConfirmation: count((a) => a.awaitingConfirmation),
    scheduled: count((a) => a.status === "scheduled"),
    answered: count((a) => Boolean(a.response_date)),
    targets: new Set(actions.map((a) => a.target).filter(Boolean)).size
  },
  // Kept for the current page copy until /countermeasures is rebuilt at step 4.
  total: raw.total !== undefined ? raw.total : actions.length,
  answered: raw.answered,
  medianResponseDays: raw.median_response_days
};
