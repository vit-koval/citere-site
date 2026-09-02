// Display labels per language. Shared by the templates and by scripts/check.mjs,
// so the verdict-badge check compares against the same strings the build wrote.
const VERDICTS = {
  en: { false: "FALSE", misleading: "MISLEADING", unsupported: "UNSUPPORTED" },
  uk: { false: "НЕПРАВДА", misleading: "ОМАНЛИВО", unsupported: "БЕЗ ПІДТВЕРДЖЕНЬ" }
};

const BEHAVIOURS = {
  en: { repeated: "Repeated", contextualised: "Contextualised", refuted: "Refuted", dodged: "Dodged" },
  uk: { repeated: "Повторив", contextualised: "Уточнив", refuted: "Спростував", dodged: "Ухилився" }
};

const STATUSES = {
  en: {
    submitted: "Submitted", acknowledged: "Acknowledged", actioned: "Actioned",
    no_response: "No response", declined: "Declined", completed: "Completed",
    live: "Live", published: "Published", receipt_confirmed: "Receipt confirmed"
  },
  uk: {
    submitted: "Надіслано", acknowledged: "Підтверджено отримання", actioned: "Вжито заходів",
    no_response: "Без відповіді", declined: "Відхилено", completed: "Завершено",
    live: "Опубліковано", published: "Опубліковано", receipt_confirmed: "Отримання підтверджено"
  }
};

const ACTION_TYPES = {
  en: {
    published: "Published this page", platform_report: "Reported", domain_complaint: "Domain complaint",
    shared: "Shared with", partner_publication: "Published by",
    authority_confirmation: "Authority confirmation", remeasured: "Re-measured"
  },
  uk: {
    published: "Опублікували цю сторінку", platform_report: "Повідомили", domain_complaint: "Скарга на домен",
    shared: "Передали", partner_publication: "Опублікував партнер",
    authority_confirmation: "Підтвердження від органу влади", remeasured: "Повторний вимір"
  }
};

const NETWORKS = {
  en: {
    pravda: "Pravda", doppelganger: "Doppelganger", matryoshka: "Matryoshka",
    "storm-1516": "Storm-1516", "state-media": "State media", other: "Other"
  },
  uk: {
    pravda: "Pravda", doppelganger: "Doppelganger", matryoshka: "Matryoshka",
    "storm-1516": "Storm-1516", "state-media": "Державні медіа", other: "Інша"
  }
};

const CHATBOTS = {
  chatgpt: "ChatGPT", gemini: "Gemini", grok: "Grok", claude: "Claude",
  copilot: "Copilot", perplexity: "Perplexity", deepseek: "DeepSeek", "le-chat": "Le Chat"
};

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  uk: ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"]
};

const pick = (table, lang, key) => (table[lang] || table.en)[key] || (table.en[key] ?? key);

module.exports = { VERDICTS, BEHAVIOURS, STATUSES, ACTION_TYPES, NETWORKS, CHATBOTS, MONTHS, pick };
