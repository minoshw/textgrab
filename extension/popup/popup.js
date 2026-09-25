const RESTRICTED_PREFIXES = ["about:", "file:", "moz-extension:"];
const RESTRICTED_DOMAINS = ["addons.mozilla.org", "chatgpt.com", "claude.ai", "perplexity.ai", "gemini.google.com", "copilot.microsoft.com"];
const LOGIN_PATH_PREFIXES = [
  "/login",
  "/signin",
  "/sign-in",
  "/signup",
  "/sign-up",
  "/log-in",
  "/register",
  "/registration",
  "/create-account",
  "/auth",
  "/authenticate",
  "/logon",
];

const titleEl = document.getElementById("page-title");
const urlEl = document.getElementById("page-url");
const statsEl = document.getElementById("page-stats");
const manualCopyEl = document.getElementById("manual-copy");
const btnArticle = document.getElementById("btn-article");
const DEFAULT_ARTICLE_LABEL = "Copy Page Content";
const templateDropdownEl = document.getElementById("template-dropdown");
const templateToggleEl = document.getElementById("template-toggle");
const templateLabelEl = document.getElementById("template-label");
const templateMenuEl = document.getElementById("template-menu");

const TEMPLATE_NAMES = {
  none: "Default",
  summarize: "Summarize",
  explain: "Explain simply",
  questions: "Study questions",
  todolist: "Action items",
  article: "Fresh content",
};

const TEMPLATE_DESC = {
  none: "No template",
  summarize: "Concise bullet points",
  explain: "Beginner-friendly",
  questions: "10 Q&A pairs",
  todolist: "Checklist format",
  article: "Latest clean version",
};

let templateValue = "none";
let templateSelectionVersion = 0;

const PRESET_TEMPLATES = {
  summarize: "Summarize the following article in concise bullet points:\n\n",
  explain:
    "Explain the following article in simple terms, as if I were a beginner:\n\n",
  questions:
    "Read the following article and generate 10 study questions with answers:\n\n",
  todolist:
    "Extract all action items and tasks from the following article as a checklist:\n\n",
  article:
    "Here's the current version of this article content since IF you may not have access to the latest:\n\n",
};

let activeTab = null;
let statusTimeout = null;
let loadingInterval = null;

function stopButtonLoading() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

function setButtonLoading(btn) {
  if (statusTimeout) {
    clearTimeout(statusTimeout);
    statusTimeout = null;
  }
  stopButtonLoading();

  const label = btn.querySelector("span") || btn;
  let dots = 0;
  label.textContent = "Copying";
  btn.disabled = true;
  loadingInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    label.textContent = `Copying${".".repeat(dots)}`;
  }, 350);
}

function setButtonStatus(btn, text, duration = 2000) {
  stopButtonLoading();
  if (statusTimeout) clearTimeout(statusTimeout);

  const label = btn.querySelector("span") || btn;
  label.textContent = text;
  btn.disabled = false;

  statusTimeout = setTimeout(() => {
    statusTimeout = null;
    label.textContent = DEFAULT_ARTICLE_LABEL;
  }, duration);
}

function showManualCopy(text) {
  manualCopyEl.value = text;
  manualCopyEl.style.display = "block";
  manualCopyEl.focus();
  manualCopyEl.select();
}

function hideManualCopy() {
  manualCopyEl.style.display = "none";
  manualCopyEl.value = "";
}

function isRestricted(url) {
  if (!url) return true;
  if (RESTRICTED_PREFIXES.some((p) => url.startsWith(p))) return true;

  try {
    const hostname = new URL(url).hostname;
    if (RESTRICTED_DOMAINS.some((d) => hostname === d || hostname.endsWith("." + d))) return true;
  } catch (e) {}

  const path = url.split(/[?#]/)[0].toLowerCase();
  return LOGIN_PATH_PREFIXES.some((p) => path.includes(p));
}

function normalizeTemplateValue(value) {
  return value === "none" || Object.prototype.hasOwnProperty.call(PRESET_TEMPLATES, value)
    ? value
    : "none";
}

async function loadTemplate() {
  try {
    const data = await browser.storage.local.get(["templateSelect"]);
    if (templateSelectionVersion === 0) {
      templateValue = normalizeTemplateValue(data.templateSelect);
    }
  } catch (e) {}
  applyTemplateSelection();
}

function applyTemplateSelection() {
  const name = TEMPLATE_NAMES[templateValue] || TEMPLATE_NAMES.none;
  const desc = TEMPLATE_DESC[templateValue];
  templateLabelEl.textContent = desc ? `${name} — ${desc}` : name;
}

function setTemplate(value, save = true) {
  templateValue = normalizeTemplateValue(value);
  templateSelectionVersion += 1;
  applyTemplateSelection();
  if (save) saveTemplate();
}

async function saveTemplate() {
  try {
    await browser.storage.local.set({
      templateSelect: templateValue,
    });
  } catch (e) {}
}

async function init() {
  btnArticle.textContent = DEFAULT_ARTICLE_LABEL;
  templateDropdownEl.classList.remove("open");
  templateMenuEl.hidden = true;
  templateMenuEl.classList.add("hidden");
  templateMenuEl.style.display = "none";

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;
  titleEl.textContent = tab.title || "Untitled page";
  urlEl.textContent = tab.url || "";
  statsEl.textContent = "";

  await loadTemplate();

  if (isRestricted(tab.url)) {
    document.querySelectorAll("button").forEach((b) => (b.disabled = true));
    statsEl.textContent = "N/A";
    return;
  }

  try {
    const res = await browser.runtime.sendMessage({
      type: "get-stats",
      tabId: tab.id,
    });
    if (res && res.stats) {
      statsEl.textContent = `${res.stats.chars.toLocaleString()} chars · ${res.stats.words.toLocaleString()} words`;
    } else {
      statsEl.textContent = "N/A";
    }
  } catch (e) {
    statsEl.textContent = "N/A";
  }
}

function applyTemplate() {
  if (templateValue === "none") return "";
  return PRESET_TEMPLATES[templateValue] || "";
}

async function sendToContent(type, btn) {
  hideManualCopy();
  if (!activeTab || isRestricted(activeTab.url)) {
    return;
  }

  setButtonLoading(btn);

  try {
    const prefix = applyTemplate();
    const res = await browser.runtime.sendMessage({
      type,
      tabId: activeTab.id,
      prefix,
    });
    handleResult(res, btn);
  } catch (e) {
    setButtonStatus(btn, "✕ Failed");
  }
}

function handleResult(res, btn) {
  if (!res) {
    setButtonStatus(btn, "✕ No content");
    return;
  }
  if (res.noSelection) {
    setButtonStatus(btn, "✕ No selection");
    return;
  }
  if (res.noArticle) {
    setButtonStatus(btn, "✕ No article");
    return;
  }
  if (res.ok) {
    setButtonStatus(btn, "✓ Copied to clipboard");
  } else {
    setButtonStatus(btn, "✕ Failed");
    showManualCopy(res.text || "");
  }
}

btnArticle.addEventListener("click", () =>
  sendToContent("copy-article", btnArticle),
);

templateToggleEl.addEventListener("click", (e) => {
  e.stopPropagation();
  const willOpen = templateMenuEl.hidden;
  templateDropdownEl.classList.toggle("open", willOpen);
  if (willOpen) {
    templateMenuEl.removeAttribute("hidden");
    templateMenuEl.hidden = false;
    templateMenuEl.classList.remove("hidden");
    templateMenuEl.style.display = "flex";
    highlightActiveTemplate();
  } else {
    closeTemplateMenu();
  }
});

templateMenuEl.querySelectorAll(".dropdown-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    setTemplate(item.dataset.value);
    closeTemplateMenu();
  });
});

function highlightActiveTemplate() {
  templateMenuEl.querySelectorAll(".dropdown-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.value === templateValue);
  });
}

function closeTemplateMenu() {
  templateMenuEl.removeAttribute("hidden");
  templateMenuEl.setAttribute("hidden", "");
  templateMenuEl.hidden = true;
  templateMenuEl.classList.add("hidden");
  templateMenuEl.style.display = "none";
  templateDropdownEl.classList.remove("open");
  applyTemplateSelection();

  setTimeout(() => {
    templateMenuEl.style.display = "none";
  }, 0);
}

document.addEventListener("click", (e) => {
  if (!templateDropdownEl.contains(e.target)) {
    closeTemplateMenu();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeTemplateMenu();
  }
});

init();
