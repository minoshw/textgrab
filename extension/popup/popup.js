const RESTRICTED_PREFIXES = ["about:", "file:", "moz-extension:"];

const titleEl = document.getElementById("page-title");
const urlEl = document.getElementById("page-url");
const manualCopyEl = document.getElementById("manual-copy");
const btnArticle = document.getElementById("btn-article");

let activeTab = null;
let statusTimeout = null;

function setButtonStatus(btn, text, duration = 2000) {
  const original = btn.textContent;
  btn.textContent = text;

  if (statusTimeout) clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    btn.textContent = original;
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
  return !url || RESTRICTED_PREFIXES.some((p) => url.startsWith(p));
}

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;
  titleEl.textContent = tab.title || "Untitled page";
  urlEl.textContent = tab.url || "";

  if (isRestricted(tab.url)) {
    document.querySelectorAll("button").forEach((b) => (b.disabled = true));
  }
}

async function sendToContent(type, btn) {
  hideManualCopy();
  if (!activeTab || isRestricted(activeTab.url)) {
    return;
  }

  try {
    const res = await browser.runtime.sendMessage({ type, tabId: activeTab.id });
    handleResult(res, btn);
  } catch (e) {
    setButtonStatus(btn, "❌ Failed");
  }
}

function handleResult(res, btn) {
  if (!res) {
    setButtonStatus(btn, "❌ No content");
    return;
  }
  if (res.noSelection) {
    setButtonStatus(btn, "❌ No selection");
    return;
  }
  if (res.noArticle) {
    setButtonStatus(btn, "❌ No article");
    return;
  }
  if (res.ok) {
    setButtonStatus(btn, "✓ Copied to clipboard");
  } else {
    setButtonStatus(btn, "❌ Failed");
    showManualCopy(res.text || "");
  }
}

btnArticle.addEventListener("click", () => sendToContent("copy-article", btnArticle));

init();
