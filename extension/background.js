const RESTRICTED_PREFIXES = ["about:", "file:", "moz-extension:"];
const RESTRICTED_DOMAINS = ["addons.mozilla.org", "chatgpt.com", "claude.ai", "perplexity.ai", "gemini.google.com", "copilot.microsoft.com"];
const LOGIN_PATH_PREFIXES = ["/login", "/signin", "/sign-in", "/signup", "/sign-up", "/log-in", "/register", "/registration", "/create-account", "/auth", "/authenticate", "/logon"];

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

async function ensureContentScript(tabId) {
  await browser.tabs.executeScript(tabId, { file: "lib/Readability.js", runAt: "document_idle" });
  await browser.tabs.executeScript(tabId, { file: "content.js", runAt: "document_idle" });
}

async function runOnTab(tab, message) {
  try {
    await ensureContentScript(tab.id);
    return await browser.tabs.sendMessage(tab.id, message);
  } catch (e) {
    return null;
  }
}

browser.contextMenus.create({
  id: "copy-article-to-ai",
  title: "Copy Page Content",
  contexts: ["page"],
});

browser.contextMenus.create({
  id: "copy-selection-to-ai",
  title: "Copy Selection",
  contexts: ["selection"],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (isRestricted(tab.url)) return;
  (async () => {
    const data = await browser.storage.local.get(["templateSelect"]);
    const templateValue = data.templateSelect || "none";
    const prefix = templateValue !== "none" ? (PRESET_TEMPLATES[templateValue] || "") : "";
    if (info.menuItemId === "copy-article-to-ai") {
      runOnTab(tab, { type: "copy-article", prefix });
    } else if (info.menuItemId === "copy-selection-to-ai") {
      runOnTab(tab, { type: "copy-selection", prefix });
    }
  })();
});

function isTrustedSender(sender) {
  return sender && sender.id === browser.runtime.id;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isTrustedSender(sender)) return;

  if (message.type === "get-stats" || message.type === "copy-article" || message.type === "copy-fulltext" || message.type === "copy-selection") {
    (async () => {
      const tab = await browser.tabs.get(message.tabId);
      if (!tab || isRestricted(tab.url)) return sendResponse(null);
      if (message.type === "get-stats") {
        return sendResponse(await runOnTab(tab, { type: "get-stats" }));
      }
      sendResponse(await runOnTab(tab, message));
    })();
    return true;
  }

  if (message.type !== "copy-fallback" || !sender.tab) return;

  (async () => {
    try {
      await browser.tabs.sendMessage(sender.tab.id, { type: "legacy-copy", text: message.text });
      sendResponse({ ok: true });
    } catch (e) {
      sendResponse({ ok: false });
    }
  })();

  return true;
});
