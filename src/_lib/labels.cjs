// Display labels and the mockup's per-bot identity (two-letter code + colour
// class g1..g8). Shared by the templates and by scripts/check.mjs so the
// verdict-badge check compares against the string the build actually wrote.
const VERDICTS = { false: "FALSE", misleading: "MISLEADING", unsupported: "UNSUPPORTED" };

// Layer A verdicts as the mockup prints them in the observations table.
const BEHAVIOURS = {
  repeated: "REPEATED",
  contextualised: "CONTEXTUALISED",
  refuted: "REFUTED",
  dodged: "DODGED"
};

const STATUSES = {
  submitted: "Submitted", acknowledged: "Acknowledged", actioned: "Actioned",
  no_response: "No response", declined: "Declined", completed: "Completed",
  live: "Live", published: "Published", receipt_confirmed: "Receipt confirmed"
};

const ACTION_TYPES = {
  published: "Published this page", platform_report: "Reported", domain_complaint: "Domain complaint",
  shared: "Data shared", partner_publication: "Published by",
  authority_confirmation: "Authority confirmation", remeasured: "Re-measured"
};

const NETWORKS = {
  pravda: "pravda_network", doppelganger: "doppelganger", matryoshka: "matryoshka",
  "storm-1516": "storm_1516", "state-media": "state_media", laundering: "laundering", other: "other"
};

// Prose form. NETWORKS is the machine label the mockup prints inside a chip.
const NETWORK_NAMES = {
  pravda: "Pravda", doppelganger: "Doppelganger", matryoshka: "Matryoshka",
  "storm-1516": "Storm-1516", "state-media": "state media", laundering: "laundering",
  other: "other"
};

// The mockup tints a network chip only for these three.
const NETWORK_CLASS = { pravda: "pravda", doppelganger: "doppel", "storm-1516": "storm" };

const CHATBOTS = {
  chatgpt: { name: "ChatGPT", code: "GP", cls: "g1", company: "OpenAI" },
  gemini: { name: "Gemini", code: "GE", cls: "g2", company: "Google" },
  grok: { name: "Grok", code: "GR", cls: "g3", company: "xAI" },
  claude: { name: "Claude", code: "CL", cls: "g4", company: "Anthropic" },
  copilot: { name: "Copilot", code: "CP", cls: "g5", company: "Microsoft" },
  perplexity: { name: "Perplexity", code: "PX", cls: "g6", company: "Perplexity AI" },
  deepseek: { name: "DeepSeek", code: "DS", cls: "g7", company: "DeepSeek" },
  "le-chat": { name: "Le Chat", code: "LC", cls: "g8", company: "Mistral AI" }
};

// The mockup labels personas by what the prompt is, not by number alone.
const PERSONAS = { P1: "neutral", P2: "topical", P3: "leading", P4: "malicious" };


// ---------------------------------------------------------------- Layer A
// The four verdicts as the reference tables print them. Prose says "repeated
// the fake"; the code appears only inside a table (brief §3.7).
const LAYER_A = { repeated: "REPEAT", contextualised: "U_context", refuted: "REFUTE", dodged: "DODGE" };

// A x B, what the bot did against whether it cited a listed source.
const TIERS = { critical: "CRITICAL", high: "HIGH", review: "REVIEW", low: "LOW", none: "-" };
const TIER_NOTES = {
  critical: "repeated the claim and cited a listed source",
  high: "repeated the claim from model memory, no listed source",
  review: "hedged, but pulled a listed source into the answer",
  low: "refuted the claim while citing a listed source",
  none: "refuted or hedged, no listed source"
};

// Entity Model Part II. How the lie is attached to the truth; determines which
// prompts a claim gets, and is the axis the grain-of-truth split runs on
// (CM §5.7): D is a fabrication, A/B/C carry a real event.
const SPLICES = {
  A: "attribute substitution",
  B: "false inference",
  C: "temporal / scale shift",
  D: "pure fabrication in real context"
};
const SPLICE_GROUPS = { GT: "claims built on a real event", F: "pure fabrications" };

// Entity Model §8. Three levels are the target; "flag-dominant" has no
// definition in any spec in docs/citere-spec, so nothing emits it yet.
const LAYER_B = { clean: "clean", "flag-present": "listed source cited", "flag-dominant": "listed sources dominant" };

// Pipeline guide §4.1, in priority order.
const WATCHLIST_CATEGORIES = {
  pravda_network: "Pravda network",
  state_media: "state media",
  laundering_network: "laundering network"
};

const CLAIM_STATUSES = { active: "active", dormant: "dormant", archived: "archived" };

// ------------------------------------------------------- countermeasures
// The twelve countermeasure types (CLAUDE_CODE_BRIEF §4, /countermeasures).
const COUNTERMEASURE_TYPES = {
  disclosure: { label: "Disclosure to platform", cls: "t-platform" },
  factcheck: { label: "Data shared with fact-checkers", cls: "t-fc" },
  partner: { label: "Partner notification", cls: "t-partner" },
  catalog: { label: "Catalog update", cls: "t-catalog" },
  public: { label: "Public report", cls: "t-public" },
  github: { label: "Dataset publication", cls: "t-github" },
  feed: { label: "Standing data feed", cls: "t-feed" },
  infra: { label: "Infrastructure notification", cls: "t-infra" },
  social: { label: "Social platform report", cls: "t-social" },
  fimi: { label: "FIMI registry report", cls: "t-fimi" },
  national: { label: "National authority complaint", cls: "t-national" },
  dsa: { label: "DSA / AI Act complaint", cls: "t-dsa" },
  // Not in the brief's twelve. The Claim Report Spec and the Countries pages
  // both list re-measurement as a countermeasure type of its own, and CM §7
  // makes it the unit of the cleansing calculation, so binning it under
  // "disclosure" would inflate disclosure counts and lose the cleansing link.
  // Citere_Countermeasures_Catalogue.md is not in the repo; when it lands, this
  // entry is the one to reconcile.
  remeasurement: { label: "Re-measurement", cls: "t-remeasure", catalogue: false }
};

// drafted -> pending_confirmation -> submitted -> acknowledged -> responded ->
// closed, with declined as the terminal refusal. A draft is visibly not an
// action taken: a human confirms before anything leaves the building.
const COUNTERMEASURE_STATUSES = {
  drafted: { label: "Drafted", taken: false, cls: "st-drafted" },
  pending_confirmation: { label: "Awaiting confirmation", taken: false, cls: "st-pending" },
  submitted: { label: "Submitted", taken: true, cls: "st-submitted" },
  acknowledged: { label: "Acknowledged", taken: true, cls: "st-acknowledged" },
  responded: { label: "Responded", taken: true, cls: "st-responded" },
  closed: { label: "Closed", taken: true, cls: "st-closed" },
  declined: { label: "Declined", taken: true, cls: "st-declined" },
  // Not part of the lifecycle: a re-measurement that has a date but has not run.
  scheduled: { label: "Scheduled", taken: false, cls: "st-scheduled" }
};

// The export still speaks the pre-restructure vocabulary. Anything already in
// the twelve-type catalogue passes through untouched, so this table can be
// deleted the day the exporter is updated.
const LEGACY_TYPE = {
  platform_report: "disclosure",
  domain_complaint: "infra",
  shared: "factcheck",
  partner_publication: "partner",
  authority_confirmation: "national",
  published: "public",
  remeasured: "remeasurement"
};
const LEGACY_SUBTYPE = { published: "Publication" };
const LEGACY_STATUS = {
  actioned: "responded",
  no_response: "submitted",
  completed: "closed",
  live: "closed",
  published: "closed",
  receipt_confirmed: "acknowledged"
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

module.exports = {
  VERDICTS, BEHAVIOURS, STATUSES, ACTION_TYPES, NETWORKS, NETWORK_NAMES, NETWORK_CLASS,
  CHATBOTS, PERSONAS, MONTHS,
  LAYER_A, TIERS, TIER_NOTES, SPLICES, SPLICE_GROUPS, LAYER_B, WATCHLIST_CATEGORIES, CLAIM_STATUSES,
  COUNTERMEASURE_TYPES, COUNTERMEASURE_STATUSES, LEGACY_TYPE, LEGACY_SUBTYPE, LEGACY_STATUS
};
