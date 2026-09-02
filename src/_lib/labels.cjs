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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

module.exports = {
  VERDICTS, BEHAVIOURS, STATUSES, ACTION_TYPES, NETWORKS, NETWORK_NAMES, NETWORK_CLASS,
  CHATBOTS, PERSONAS, MONTHS
};
