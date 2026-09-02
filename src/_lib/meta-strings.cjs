// Titles and meta descriptions in both languages, built from data so a long
// claim title or a thin facet can never breach the 65 / 120-160 char limits
// (CLAUDE.md 10). fitDescription throws at build time if a language runs short.
const { fitTitle, fitDescription, listOf } = require("./meta.cjs");
const { VERDICTS, CHATBOTS, NETWORKS } = require("./labels.cjs");

const nameCache = new Map();
const nameOf = (lang, type, value) => {
  const key = `${lang}|${type}`;
  if (!nameCache.has(key)) {
    try { nameCache.set(key, new Intl.DisplayNames([lang], { type })); } catch { nameCache.set(key, null); }
  }
  const formatter = nameCache.get(key);
  const raw = type === "region" ? String(value).toUpperCase() : String(value);
  try { return (formatter && formatter.of(raw)) || raw; } catch { return raw; }
};

const countryName = (lang, code) => nameOf(lang, "region", code);
const conj = { en: "and", uk: "та" };
const list = (lang, items) => listOf(items, conj[lang] || conj.en);

const PAGES = {
  index: {
    en: {
      title: "Do AI chatbots repeat Russian disinformation about Ukraine?",
      h1: "Do AI chatbots repeat Russian disinformation about Ukraine?",
      description: [
        "We test ChatGPT, Gemini, Grok, Claude, Copilot, Perplexity, DeepSeek and Le Chat for Russian disinformation about Ukraine,",
        "and report what we find.",
        "Open data."
      ]
    },
    uk: {
      title: "Чи повторюють чат-боти російську дезінформацію?",
      h1: "Чи повторюють чат-боти ШІ російську дезінформацію про Україну?",
      description: [
        "Ми тестуємо ChatGPT, Gemini, Grok, Claude, Copilot, Perplexity, DeepSeek і Le Chat на російську дезінформацію про Україну",
        "і повідомляємо про знайдене платформам.",
        "Відкриті дані."
      ]
    }
  },
  registry: {
    en: {
      title: "Registry of false claims in AI chatbot answers",
      h1: "False claims about Ukraine found in AI chatbot answers",
      description: [
        "Every false claim about Ukraine we have documented in a public AI chatbot answer.",
        "Verdict, evidence, the sources cited,",
        "and what changed after we reported it.",
        "Open data under CC BY 4.0."
      ]
    },
    uk: {
      title: "Реєстр неправдивих тверджень у відповідях чат-ботів",
      h1: "Неправдиві твердження про Україну у відповідях чат-ботів",
      description: [
        "Кожне неправдиве твердження про Україну, яке ми задокументували у відповіді публічного чат-бота.",
        "Вердикт, докази, процитовані джерела",
        "і що змінилося після звернення.",
        "Відкриті дані."
      ]
    }
  },
  methodology: {
    en: {
      title: "How we measure disinformation in chatbot answers",
      h1: "How we measure",
      description: [
        "Sitera classifies what a chatbot answer did with a documented false claim: repeated, contextualised, refuted or dodged.",
        "Four personas, never averaged."
      ]
    },
    uk: {
      title: "Як ми вимірюємо дезінформацію у відповідях чат-ботів",
      h1: "Як ми вимірюємо",
      description: [
        "Sitera класифікує, що відповідь чат-бота зробила із задокументованим неправдивим твердженням: повторила, уточнила, спростувала чи ухилилася.",
        "Чотири персони, без усереднення."
      ]
    }
  },
  about: {
    en: {
      title: "About Sitera",
      h1: "About Sitera",
      description: [
        "Sitera is an independent Ukrainian research team testing public AI chatbots for Russian disinformation about Ukraine,",
        "and getting what it finds corrected."
      ]
    },
    uk: {
      title: "Про Sitera",
      h1: "Про Sitera",
      description: [
        "Sitera — незалежна українська дослідницька команда, яка тестує публічні чат-боти на російську дезінформацію про Україну",
        "і домагається її виправлення."
      ]
    }
  },
  data: {
    en: {
      title: "Open data on AI chatbots and disinformation",
      h1: "Data",
      description: [
        "Download the Sitera claim registry, chatbot observations, domain watchlist and escalation log as CSV and JSON",
        "under CC BY 4.0, with citation."
      ]
    },
    uk: {
      title: "Відкриті дані про чат-боти і дезінформацію",
      h1: "Дані",
      description: [
        "Завантажте реєстр тверджень Sitera, спостереження за чат-ботами, список доменів і журнал ескалацій у форматах CSV і JSON",
        "за ліцензією CC BY 4.0."
      ]
    }
  },
  sources: {
    en: {
      title: "Domains cited by AI chatbots, by network",
      h1: "Domains from Russian influence networks cited by AI chatbots",
      description: [
        "The domains from Russian influence networks that we have recorded in public AI chatbot answers,",
        "with the published attribution for each one.",
        "Download as CSV or STIX 2.1."
      ]
    },
    uk: {
      title: "Домени, які цитують чат-боти, за мережами",
      h1: "Домени російських мереж впливу, які цитують чат-боти",
      description: [
        "Домени з російських мереж впливу, які ми зафіксували у відповідях публічних чат-ботів,",
        "з опублікованою атрибуцією кожного.",
        "Завантаження у CSV або STIX 2.1."
      ]
    }
  },
  escalations: {
    en: {
      title: "Escalation log: what we reported and what happened",
      h1: "Escalation log",
      description: [
        "Every report Sitera sent to a platform or registrar about Russian disinformation in AI chatbot answers.",
        "Fact, date and status only; never the correspondence."
      ]
    },
    uk: {
      title: "Журнал ескалацій: що ми повідомили і що сталося",
      h1: "Журнал ескалацій",
      description: [
        "Кожне звернення Sitera до платформи чи реєстратора щодо російської дезінформації у відповідях чат-ботів.",
        "Лише факт, дата і статус; ніколи не листування."
      ]
    }
  },
  monitor: {
    en: {
      title: "Monthly monitor: AI chatbots and Ukraine",
      h1: "Monthly monitor of AI chatbots on Russian disinformation",
      description: [
        "How eight public AI chatbots handled documented false claims about Ukraine, month by month:",
        "behaviour and cited sources per chatbot, country and question type."
      ]
    },
    uk: {
      title: "Щомісячний монітор: чат-боти і Україна",
      h1: "Щомісячний монітор чат-ботів щодо російської дезінформації",
      description: [
        "Як вісім публічних чат-ботів повелися із задокументованими неправдивими твердженнями про Україну, місяць за місяцем:",
        "поведінка і джерела за кожним чат-ботом."
      ]
    }
  },
  platforms: {
    en: {
      title: "Chatbots we test for Russian disinformation",
      h1: "How each AI chatbot handles Russian disinformation about Ukraine",
      description: [
        "One page per chatbot: how each product we test handled documented false claims about Ukraine.",
        "Which claims it repeated,",
        "and every report we sent to its maker.",
        "Open data."
      ]
    },
    uk: {
      title: "Чат-боти, які ми тестуємо на дезінформацію",
      h1: "Як кожен чат-бот поводиться з російською дезінформацією про Україну",
      description: [
        "Одна сторінка на кожен чат-бот: як продукт повівся із задокументованими неправдивими твердженнями про Україну.",
        "Які твердження він повторював",
        "і які звернення ми надсилали."
      ]
    }
  }
};

const page = (name, lang) => {
  const entry = PAGES[name][lang] || PAGES[name].en;
  return {
    title: fitTitle(entry.title),
    h1: entry.h1,
    description: fitDescription(entry.description, `${name} (${lang})`)
  };
};

const claim = (c, lang) => {
  const bots = c.repeatedBy.map((b) => CHATBOTS[b] || b);
  const countries = list(lang, c.countries.map((code) => countryName(lang, code)));
  const parts = {
    en: [
      `${VERDICTS.en[c.verdict]}.`,
      bots.length
        ? `Repeated by ${list("en", bots)} in ${c.counts.observations} recorded answers.`
        : `Recorded in ${c.counts.observations} chatbot answers.`,
      `Tested in ${countries}.`,
      "Verdict, evidence, the domains cited and every action we took.",
      `Updated ${c.updated}.`
    ],
    uk: [
      `${VERDICTS.uk[c.verdict]}.`,
      bots.length
        ? `Повторили: ${list("uk", bots)} — у ${c.counts.observations} зафіксованих відповідях.`
        : `Зафіксовано у ${c.counts.observations} відповідях чат-ботів.`,
      `Тестували в країнах: ${countries}.`,
      "Вердикт, докази, процитовані домени і всі наші дії.",
      `Оновлено ${c.updated}.`
    ]
  };
  return {
    title: fitTitle(`“${c.title_en}”`),
    description: fitDescription(parts[lang] || parts.en, `claim ${c.id} (${lang})`)
  };
};

const FACET_HEADING = {
  en: {
    cluster: (f) => `False claims about Ukraine: ${f.label}`,
    country: (f) => `Russian disinformation in AI chatbot answers: ${f.label}`,
    language: (f) => `False claims found in AI chatbot answers in ${f.label}`,
    chatbot: (f) => `False claims about Ukraine repeated by ${f.label}`,
    verdict: (f) => `Claims we rated ${f.label}`
  },
  uk: {
    cluster: (f) => `Неправдиві твердження про Україну: ${f.label}`,
    country: (f) => `Російська дезінформація у відповідях чат-ботів: ${f.label}`,
    language: (f) => `Неправдиві твердження у відповідях чат-ботів (${f.label})`,
    chatbot: (f) => `Неправдиві твердження про Україну, які повторив ${f.label}`,
    verdict: (f) => `Твердження з вердиктом ${f.label}`
  }
};

const FACET_LEAD = {
  en: {
    cluster: (f) => `This cluster groups the claims that share one narrative: ${f.label}.`,
    country: (f) => `These are the claims we recorded in chatbot answers served to users in ${f.label}.`,
    language: (f) => `These are the claims we recorded in chatbot answers given in ${f.label}.`,
    chatbot: (f) => `These are the claims ${f.label} handled in our runs.`,
    verdict: (f) => `These are the claims we rated ${f.label}.`
  },
  uk: {
    cluster: (f) => `Цей кластер об'єднує твердження одного наративу: ${f.label}.`,
    country: (f) => `Це твердження, які ми зафіксували у відповідях чат-ботів для користувачів у країні ${f.label}.`,
    language: (f) => `Це твердження, які ми зафіксували у відповідях чат-ботів цією мовою: ${f.label}.`,
    chatbot: (f) => `Це твердження, з якими ${f.label} мав справу в наших прогонах.`,
    verdict: (f) => `Це твердження, яким ми дали вердикт ${f.label}.`
  }
};

const plural = (lang, n, forms) => `${n} ${forms[lang === "uk" ? (n === 1 ? 0 : 1) : n === 1 ? 0 : 1]}`;

const facet = (f, lang) => {
  const heading = (FACET_HEADING[lang] || FACET_HEADING.en)[f.type](f);
  const parts = {
    en: [
      `${plural("en", f.claims.length, ["documented false claim", "documented false claims"])} about Ukraine in this view,`,
      `recorded in ${plural("en", f.observations, ["chatbot answer", "chatbot answers"])}.`,
      "Verdict, evidence, the sources cited and every action we took.",
      "Open data under CC BY 4.0."
    ],
    uk: [
      `${plural("uk", f.claims.length, ["задокументоване неправдиве твердження", "задокументованих неправдивих тверджень"])} про Україну в цьому зрізі,`,
      `зафіксовано у ${plural("uk", f.observations, ["відповіді чат-бота", "відповідях чат-ботів"])}.`,
      "Вердикт, докази, процитовані джерела і всі наші дії.",
      "Відкриті дані."
    ]
  };
  const lead = (FACET_LEAD[lang] || FACET_LEAD.en)[f.type](f);
  const intro = {
    en: `${lead} ${plural("en", f.claims.length, ["claim", "claims"])}, ${plural("en", f.observations, ["recorded answer", "recorded answers"])}, and ${f.repeatedIn} of them repeated by at least one chatbot. Each claim page carries the evidence, the sources cited and every action we took.`,
    uk: `${lead} ${plural("uk", f.claims.length, ["твердження", "тверджень"])}, ${plural("uk", f.observations, ["зафіксована відповідь", "зафіксованих відповідей"])}, з них ${f.repeatedIn} повторив щонайменше один чат-бот. На сторінці кожного твердження є докази, процитовані джерела і всі наші дії.`
  };
  return {
    heading,
    title: fitTitle(heading),
    description: fitDescription(parts[lang] || parts.en, `${f.url} (${lang})`),
    intro: intro[lang] || intro.en
  };
};

const source = (s, lang) => {
  const network = (NETWORKS[lang] || NETWORKS.en)[s.network];
  const parts = {
    en: [
      `${s.defanged} is on the Sitera watchlist as part of the ${network} network.`,
      `Recorded in ${s.citedCount} documented ${s.citedCount === 1 ? "claim" : "claims"} since ${s.first_seen}.`,
      "Attribution, the answers that cited it, and the complaints we filed.",
      "Open data under CC BY 4.0."
    ],
    uk: [
      `${s.defanged} є у списку Sitera як частина мережі ${network}.`,
      `Зафіксовано у ${s.citedCount} задокументованих твердженнях від ${s.first_seen}.`,
      "Атрибуція, відповіді з цитуванням і подані нами скарги.",
      "Відкриті дані за ліцензією CC BY 4.0."
    ]
  };
  const titles = {
    en: `${s.defanged} — a domain cited by AI chatbots`,
    uk: `${s.defanged} — домен, який цитують чат-боти`
  };
  return {
    title: fitTitle(titles[lang] || titles.en),
    description: fitDescription(parts[lang] || parts.en, `${s.url} (${lang})`)
  };
};

const platform = (p, lang) => {
  const parts = {
    en: [
      `How ${p.name} (${p.company}) handled documented false claims about Ukraine:`,
      `${p.stats.repeated} of ${p.stats.nonEvasive} non-evasive answers repeated one,`,
      `${p.stats.contaminated} cited a watchlisted domain.`,
      "Per persona, with model versions."
    ],
    uk: [
      `Як ${p.name} (${p.company}) повівся із задокументованими неправдивими твердженнями про Україну:`,
      `${p.stats.repeated} з ${p.stats.nonEvasive} відповідей по суті повторили твердження,`,
      `${p.stats.contaminated} послалися на домен зі списку.`,
      "За персонами, з версіями моделей."
    ]
  };
  const titles = {
    en: `${p.name} and Russian disinformation on Ukraine`,
    uk: `${p.name} і російська дезінформація про Україну`
  };
  const headings = {
    en: `How ${p.name} handles Russian disinformation about Ukraine`,
    uk: `Як ${p.name} поводиться з російською дезінформацією про Україну`
  };
  return {
    title: fitTitle(titles[lang] || titles.en),
    description: fitDescription(parts[lang] || parts.en, `${p.url} (${lang})`),
    heading: headings[lang] || headings.en
  };
};

const country = (p, lang) => {
  const name = countryName(lang, p.key);
  const parts = {
    en: [
      `What public AI chatbots told users in ${name} about documented false claims on Ukraine:`,
      `${p.stats.answers} recorded answers, ${p.stats.repeated} of them repeating a claim as fact.`,
      "Per chatbot and per persona, with open data."
    ],
    uk: [
      `Що публічні чат-боти казали користувачам у країні ${name} про задокументовані неправдиві твердження щодо України:`,
      `${p.stats.answers} зафіксованих відповідей, ${p.stats.repeated} з них подали твердження як факт.`,
      "За чат-ботами і персонами."
    ]
  };
  const headings = {
    en: `Russian disinformation in AI chatbots: ${name}`,
    uk: `Російська дезінформація в чат-ботах: ${name}`
  };
  return {
    name,
    title: fitTitle(headings[lang] || headings.en),
    description: fitDescription(parts[lang] || parts.en, `${p.url} (${lang})`),
    heading: headings[lang] || headings.en
  };
};

const report = (r, stats, lang) => {
  const parts = {
    en: [
      `Sitera monitor ${r.period}:`,
      `${stats.answers} answers from ${stats.chatbots.length} public AI chatbots in ${stats.countries.length} countries,`,
      "scored per persona for repeating documented false claims about Ukraine.",
      "Open data, CC BY 4.0."
    ],
    uk: [
      `Монітор Sitera за ${r.period}:`,
      `${stats.answers} відповідей від ${stats.chatbots.length} публічних чат-ботів у ${stats.countries.length} країнах.`,
      "Задокументовані неправдиві твердження про Україну,",
      "оцінка за персонами, без усереднення.",
      "Відкриті дані."
    ]
  };
  const titles = {
    en: `Monitor ${r.period}: AI chatbots on Ukraine`,
    uk: `Монітор ${r.period}: чат-боти про Україну`
  };
  return {
    title: fitTitle(titles[lang] || titles.en),
    description: fitDescription(parts[lang] || parts.en, `/monitor/${r.slug}/ (${lang})`)
  };
};

module.exports = { page, claim, facet, source, platform, country, report, countryName };
