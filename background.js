const RESTRICTED_PREFIXES = ["about:", "file:", "moz-extension:"];

function isRestricted(url) {
  return !url || RESTRICTED_PREFIXES.some((p) => url.startsWith(p));
}

async function injectContentScript(tabId) {
  try {
    await browser.scripting.executeScript({
      target: { tabId },
      files: ["lib/Readability.js", "content.js"]
    });
  } catch (e) {
    console.error("Failed to inject content script:", e);
    throw e;
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

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (isRestricted(tab.url)) return;
  try {
    await injectContentScript(tab.id);
    if (info.menuItemId === "copy-article-to-ai") {
      browser.tabs.sendMessage(tab.id, { type: "copy-article" });
    } else if (info.menuItemId === "copy-selection-to-ai") {
      browser.tabs.sendMessage(tab.id, { type: "copy-selection" });
    }
  } catch (e) {
    console.error("Context menu action failed:", e);
  }
});

// Fallback clipboard write for pages where navigator.clipboard is unavailable
// (e.g. non-secure http:// contexts): run a legacy execCommand copy in-page.
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
