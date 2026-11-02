export const LANGUAGES = ["kk", "ru", "en"];

export function validLocale(value) {
  return LANGUAGES.includes(value) ? value : "en";
}

export let locale = "en";

let dictionary = {};
let originalTitle = "";
let initialization;

const contentBindings = new Map();
const originals = new WeakMap();
const attributes = new WeakMap();

export function setDictionary(data) {
  dictionary = data;
}

const choose = (kk, ru, en, language) => {
  return { kk, ru, en }[language];
};

export function translateText(source, language = locale) {
  const raw = String(source ?? "");
  const key = raw.trim();

  if (!key) return raw;

  let translated = dictionary[key]?.[language];

  if (translated === undefined) {
    const numbered = /^(\d+)-күн · (.*)$/.exec(key);

    if (numbered) {
      translated =
        choose(
          `${numbered[1]}-күн`,
          `${numbered[1]}-й день`,
          `Day ${numbered[1]}`,
          language
        ) +
        " · " +
        translateText(numbered[2], language);
    }

    const numberedQuestion = /^(\d+)\. (.*)$/.exec(key);

    if (
      translated === undefined &&
      numberedQuestion &&
      dictionary[numberedQuestion[2]]
    ) {
      translated =
        numberedQuestion[1] +
        ". " +
        translateText(numberedQuestion[2], language);
    }

    const rules = [
      [
        /^(\d+) \/ 14 күннен сақталған жазба бар\.$/,
        (n) =>
          choose(
            `${n} / 14 күннен сақталған жазба бар.`,
            `Сохранены записи за ${n} из 14 дней.`,
            `Entries saved for ${n} of 14 days.`,
            language
          ),
      ],
      [
        /^(\d+) \/ 14 күннен жазба бар\.$/,
        (n) =>
          choose(
            `${n} / 14 күннен жазба бар.`,
            `Есть записи за ${n} из 14 дней.`,
            `Entries recorded for ${n} of 14 days.`,
            language
          ),
      ],
      [
        /^(\d+) сақталған жаттығу\.$/,
        (n) =>
          choose(
            `${n} сақталған жаттығу.`,
            `Сохранено упражнений: ${n}.`,
            `${n} saved activities.`,
            language
          ),
      ],
      [/^\/ (.*)$/, (label) => "/ " + translateText(label, language)],
      [
        /^(.*) · Кабинет ↗$/,
        (code) =>
          code +
          choose(
            " · Кабинет ↗",
            " · Кабинет ↗",
            " · Account ↗",
            language
          ),
      ],
      [
        /^(\d+)-күн$/,
        (n) =>
          choose(
            `${n}-күн`,
            `${n}-й день`,
            `Day ${n}`,
            language
          ),
      ],
      [
        /^(.*?) · (\d+) сек · (\d+) кідіріс · (\d+) ой · (\d+)\/10$/,
        (date, time, pauses, ideas, confidence) =>
          choose(
            `${date} · ${time} сек · ${pauses} кідіріс · ${ideas} ой · ${confidence}/10`,
            `${date} · ${time} сек · паузы: ${pauses} · мысли: ${ideas} · ${confidence}/10`,
            `${date} · ${time} sec · ${pauses} pauses · ${ideas} ideas · ${confidence}/10`,
            language
          ),
      ],
      [
        /^(Уақыт \(сек\)|Ұзақ кідіріс|Аяқталған ой|Сенімділік): (.*)$/,
        (label, numbers) =>
          translateText(label, language) + ": " + numbers,
      ],
      [
        /^(.*?) · (admin|teacher|student) · (AI|салыстыру) · (белсенді|бұғатталған)$/,
        (code, role, group, status) =>
          code +
          " · " +
          translateText(role, language) +
          " · " +
          choose(
            group,
            group === "AI" ? "AI" : "сравнение",
            group === "AI" ? "AI" : "comparison",
            language
          ) +
          " · " +
          choose(
            status,
            status === "белсенді" ? "активен" : "заблокирован",
            status === "белсенді" ? "active" : "inactive",
            language
          ),
      ],
      [
        /^(\d+) сек · (\d+) кідіріс · (\d+) ой · сенімділік (\d+)\/10$/,
        (time, pauses, ideas, confidence) =>
          choose(
            `${time} сек · ${pauses} кідіріс · ${ideas} ой · сенімділік ${confidence}/10`,
            `${time} сек · паузы: ${pauses} · мысли: ${ideas} · уверенность ${confidence}/10`,
            `${time} sec · ${pauses} pauses · ${ideas} ideas · confidence ${confidence}/10`,
            language
          ),
      ],
      [
        /^Қосынды: (\d+) \/ 25$/,
        (n) =>
          choose(
            `Қосынды: ${n} / 25`,
            `Сумма: ${n} / 25`,
            `Total: ${n} / 25`,
            language
          ),
      ],
      [
        /^Барлығы: (\d+)\. Өңдеу, жоба, жариялау және мұрағат мәртебелері бір редакторда\.$/,
        (n) =>
          choose(
            `Барлығы: ${n}. Өңдеу, жоба, жариялау және мұрағат мәртебелері бір редакторда.`,
            `Всего: ${n}. Редактирование, черновик, публикация и архив — в одном редакторе.`,
            `Total: ${n}. Edit, save drafts, publish and archive in one editor.`,
            language
          ),
      ],
      [
        /^Аккаунттар \((\d+)\)$/,
        (n) =>
          choose(
            `Аккаунттар (${n})`,
            `Аккаунты (${n})`,
            `Accounts (${n})`,
            language
          ),
      ],
      [
        /^Мұғалім бағасы: (\d+)\/10$/,
        (n) =>
          choose(
            `Мұғалім бағасы: ${n}/10`,
            `Оценка учителя: ${n}/10`,
            `Teacher rating: ${n}/10`,
            language
          ),
      ],
      [
        /^Нақты (\d+) кодтың соңғы жауабы\.$/,
        (n) =>
          choose(
            `Нақты ${n} кодтың соңғы жауабы.`,
            `Последние ответы ${n} участников.`,
            `Latest answers from ${n} participants.`,
            language
          ),
      ],
      [
        /^Рөл: (admin|teacher|student)\. Сессия 8 сағаттан кейін аяқталады\.$/,
        (role) =>
          choose(
            `Рөл: ${role}. Сессия 8 сағаттан кейін аяқталады.`,
            `Роль: ${
              {
                admin: "администратор",
                teacher: "учитель",
                student: "ученик",
              }[role]
            }. Сессия истекает через 8 часов.`,
            `Role: ${role}. The session expires after 8 hours.`,
            language
          ),
      ],
      [
        /^(.*) · әкімші бекіткен$/,
        (label) =>
          translateText(label, language) +
          choose(
            " · әкімші бекіткен",
            " · назначено администратором",
            " · assigned by an administrator",
            language
          ),
      ],
      [
        /^(.*) (тақырыбының иллюстрациясы|мұқабасы|жағдайына арналған иллюстрация|сөйлесу жағдайының иллюстрациясы)$/,
        (title) =>
          choose(
            `${title} иллюстрациясы`,
            `Иллюстрация: ${translateText(title, language)}`,
            `Illustration: ${translateText(title, language)}`,
            language
          ),
      ],
    ];

    if (translated === undefined) {
      for (const [pattern, format] of rules) {
        const match = pattern.exec(key);

        if (match) {
          translated = format(...match.slice(1));
          break;
        }
      }
    }
  }

  if (
    translated === undefined &&
    /^(AI|Салыстыру) тобы:/.test(key)
  ) {
    translated = key.replace(
      /(AI|Салыстыру) тобы: (\d+) код, (\d+) жазба\./g,
      (_, group, people, entries) =>
        choose(
          `${group} тобы: ${people} код, ${entries} жазба.`,
          `${
            group === "AI" ? "Группа AI" : "Сравнительная группа"
          }: участников ${people}, записей ${entries}.`,
          `${
            group === "AI" ? "AI group" : "Comparison group"
          }: ${people} participants, ${entries} entries.`,
          language
        )
    );
  }

  if (translated === undefined && key.includes("\n")) {
    translated = key
      .split("\n")
      .map((line) => translateText(line, language))
      .join("\n");
  }

  if (translated === undefined) translated = key;

  const start = raw.indexOf(key);

  return (
    raw.slice(0, start) +
    translated +
    raw.slice(start + key.length)
  );
}

const skip = [
  "script",
  "style",
  "textarea",
  "input",
  "[data-no-i18n]",
  ".msg",
  ".entry .text",
  ".feedback p",
  "#previewTitle",
  "#previewBody",
  "#previewDescription",
  "#previewTask",
].join(",");

function translateNode(node) {
  if (node.parentElement?.closest(skip)) return;

  const previous = originals.get(node);

  const source =
    previous && node.data === previous.last
      ? previous.source
      : node.data;

  const result = translateText(source);

  originals.set(node, { source, last: result });

  if (node.data !== result) node.data = result;
}

function translateAttributes(element) {
  if (element.matches("[data-no-i18n]")) return;

  const state = attributes.get(element) || {};

  for (const attribute of [
    "placeholder",
    "aria-label",
    "title",
    "alt",
  ]) {
    const value = element.getAttribute(attribute);

    if (value === null) continue;

    const previous = state[attribute];

    const source =
      previous && value === previous.last
        ? previous.source
        : value;

    const result = translateText(source);

    state[attribute] = { source, last: result };

    if (result !== value) {
      element.setAttribute(attribute, result);
    }
  }

  attributes.set(element, state);
}

export function bindLocalizedText(
  element,
  source,
  translations = {}
) {
  if (!element) return;

  element.dataset.noI18n = "";
  contentBindings.set(element, { source, translations });

  const value = translations[locale]?.trim()
    ? translations[locale]
    : translateText(source);

  if (element.textContent !== value) {
    element.textContent = value;
  }
}

function apply(root = document.body) {
  for (const [element, binding] of contentBindings) {
    if (!element.isConnected) {
      contentBindings.delete(element);
      continue;
    }

    const value = binding.translations[locale]?.trim()
      ? binding.translations[locale]
      : translateText(binding.source);

    if (element.textContent !== value) {
      element.textContent = value;
    }
  }

  root?.querySelectorAll?.("option:not([value])").forEach(
    (element) => {
      element.setAttribute("value", element.textContent);
    }
  );

  if (!root) return;

  if (root.nodeType === 3) {
    translateNode(root);
    return;
  }

  if (root.nodeType !== 1) return;

  translateAttributes(root);

  root
    .querySelectorAll("[placeholder],[aria-label],[title],[alt]")
    .forEach(translateAttributes);

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );

  let node;

  while ((node = walker.nextNode())) {
    translateNode(node);
  }
}

export function setLocale(
  value,
  { persist = true } = {}
) {
  locale = validLocale(value);

  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;

  try {
    if (persist) {
      localStorage.setItem("sf_locale", locale);
    }
  } catch {}

  document.querySelectorAll("[data-language]").forEach(
    (button) => {
      const active = button.dataset.language === locale;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  );

  apply();

  document.title =
    translateText(originalTitle) + " — SPEAK FREE";

  document.dispatchEvent(
    new CustomEvent("sf:locale", { detail: locale })
  );
}

function addLanguageSwitch() {
  if (!document.getElementById("sf-language-style")) {
    const style = document.createElement("style");

    style.id = "sf-language-style";

    style.textContent = `
      .language-switch {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        padding: 4px;
        border: 1px solid #ccd7da;
        border-radius: 14px;
        background: #fff;
        max-width: 100%;
        box-sizing: border-box;
      }

      .language-switch button {
        font: 600 13px/1.2 system-ui, sans-serif;
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: #263c40;
        cursor: pointer;
        padding: 8px;
      }

      .language-switch button:hover {
        background: #e6f1ef;
      }

      .language-switch button.active {
        background: #174e47;
        color: white;
      }

      .language-switch button:focus-visible {
        outline: 3px solid #ec9b33;
        outline-offset: 2px;
      }

      .sf-language-floating {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 1000;
      }

      .sf-language-error {
        position: fixed;
        bottom: 12px;
        left: 12px;
        right: 12px;
        z-index: 1001;
        padding: 12px;
        background: #fff0e6;
        color: #572812;
        border: 1px solid #c77538;
        border-radius: 10px;
        font: 14px/1.5 system-ui, sans-serif;
      }
    `;

    document.head.append(style);
  }

  if (document.querySelector("[data-language]")) return;

  const group = document.createElement("div");

  group.className = "language-switch";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Сайт тілі");

  const languages = [
    ["kk", "ҚАЗ", "Қазақша"],
    ["ru", "РУС", "Русский"],
    ["en", "ENG", "English"],
  ];

  for (const [code, label, name] of languages) {
    const button = document.createElement("button");

    button.type = "button";
    button.dataset.language = code;
    button.dataset.noI18n = "";
    button.lang = code;
    button.textContent = label;
    button.setAttribute("aria-label", name);

    group.append(button);
  }

  const host = document.querySelector(".header-actions");

  if (host) {
    host.prepend(group);
  } else {
    group.classList.add("sf-language-floating");
    document.body.append(group);
  }
}

export function initI18n() {
  if (initialization) return initialization;

  initialization = (async () => {
    if (document.readyState === "loading") {
      await new Promise((resolve) => {
        document.addEventListener(
          "DOMContentLoaded",
          resolve,
          { once: true }
        );
      });
    }

    originalTitle = document.title.replace(
      / — SPEAK FREE$/,
      ""
    );

    const response = await fetch(
      new URL("../assets/i18n.json", import.meta.url)
    );

    if (!response.ok) {
      throw new Error(
        "i18n.json: HTTP " + response.status
      );
    }

    setDictionary(await response.json());
    addLanguageSwitch();

    let initial = "en";

    try {
      initial =
        localStorage.getItem("sf_locale") || "en";
    } catch {}

    document.querySelectorAll("[data-language]").forEach(
      (button) => {
        button.addEventListener("click", () => {
          setLocale(button.dataset.language);
        });
      }
    );

    setLocale(initial, { persist: false });

    let queued = false;

    const observer = new MutationObserver(() => {
      if (queued) return;

      queued = true;

      queueMicrotask(() => {
        queued = false;
        apply();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return observer;
  })();

  return initialization;
}

if (typeof document !== "undefined") {
  initI18n().catch((error) => {
    console.error(error);

    if (document.getElementById("sf-language-error")) {
      return;
    }

    const message = document.createElement("div");

    message.id = "sf-language-error";
    message.className = "sf-language-error";
    message.setAttribute("role", "alert");

    message.textContent =
      "Тіл файлы жүктелмеді / " +
      "Переводы не загрузились / " +
      "Translations could not be loaded. " +
      "assets/i18n.json файлын тексеріңіз.";

    message.style.cssText = [
      "position:fixed",
      "bottom:12px",
      "left:12px",
      "right:12px",
      "z-index:1001",
      "padding:12px",
      "background:#fff0e6",
      "color:#572812",
      "font:14px/1.5 system-ui,sans-serif",
    ].join(";");

    document.body.append(message);
  });
}
