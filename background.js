const RESTRICTED_PREFIXES = ["about:", "file:", "moz-extension:"];

function isRestricted(url) {
  return !url || RESTRICTED_PREFIXES.some((p) => url.startsWith(p));
}

async function ensureContentScript(tabId) {
  await browser.tabs.executeScript(tabId, { file: "lib/Readability.js", runAt: "document_idle" });
  await browser.tabs.executeScript(tabId, { file: "content.js", runAt: "document_idle" });
}

async function runOnTab(tab, type) {
  try {
    await ensureContentScript(tab.id);
    return await browser.tabs.sendMessage(tab.id, { type });
  } catch (e) {
    return null;
  }
}

browser.contextMenus.create({
  id: "copy-article-to-ai",
  title: "Copy page article to AI",
  contexts: ["page"],
});

browser.contextMenus.create({
  id: "copy-selection-to-ai",
  title: "Copy selected text to AI",
  contexts: ["selection"],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (isRestricted(tab.url)) return;
  if (info.menuItemId === "copy-article-to-ai") {
    runOnTab(tab, "copy-article");
  } else if (info.menuItemId === "copy-selection-to-ai") {
    runOnTab(tab, "copy-selection");
  }
});

function isTrustedSender(sender) {
  return sender && sender.id === browser.runtime.id;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isTrustedSender(sender)) return;

  if (message.type === "copy-article" || message.type === "copy-fulltext" || message.type === "copy-selection") {
    (async () => {
      const tab = await browser.tabs.get(message.tabId);
      if (!tab || isRestricted(tab.url)) return sendResponse(null);
      const res = message.type === "copy-fulltext"
        ? await runOnTab(tab, "copy-fulltext")
        : await runOnTab(tab, message.type);
      sendResponse(res);
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
