function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  let md = "";

  function traverseInline(node) {
    if (node.nodeType === 3) {
      const text = node.textContent;
      if (text) md += text;
      return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();
    switch (tag) {
      case "strong":
      case "b":
        md += "**";
        Array.from(node.childNodes).forEach(traverseInline);
        md += "**";
        break;
      case "em":
      case "i":
        md += "*";
        Array.from(node.childNodes).forEach(traverseInline);
        md += "*";
        break;
      case "del":
      case "strike":
      case "s":
        md += "~~";
        Array.from(node.childNodes).forEach(traverseInline);
        md += "~~";
        break;
      case "u":
        md += "__";
        Array.from(node.childNodes).forEach(traverseInline);
        md += "__";
        break;
      case "sub":
        md += "~";
        Array.from(node.childNodes).forEach(traverseInline);
        md += "~";
        break;
      case "sup":
        md += "^";
        Array.from(node.childNodes).forEach(traverseInline);
        md += "^";
        break;
      case "a":
        const href = node.getAttribute("href");
        md += "[";
        Array.from(node.childNodes).forEach(traverseInline);
        md += href ? `](${href})` : "]";
        break;
      case "img":
        const alt = node.getAttribute("alt") || "image";
        const src = node.getAttribute("src") || "";
        md += `![${alt}](${src})`;
        break;
      case "code":
        md += "`";
        Array.from(node.childNodes).forEach(traverseInline);
        md += "`";
        break;
      case "br":
        md += "\n";
        break;
      default:
        Array.from(node.childNodes).forEach(traverseInline);
    }
  }

  function traverse(node) {
    if (node.nodeType === 3) {
      const text = node.textContent.trim();
      if (text) md += text;
      return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();
    const isEmpty = !node.textContent.trim();

    if (isEmpty && !["ul", "ol"].includes(tag)) return;

    switch (tag) {
      case "h1":
        md += "# ";
        traverseInline(node);
        md += "\n\n";
        break;
      case "h2":
        md += "## ";
        traverseInline(node);
        md += "\n\n";
        break;
      case "h3":
        md += "### ";
        traverseInline(node);
        md += "\n\n";
        break;
      case "h4":
      case "h5":
      case "h6":
        md += "#### ";
        traverseInline(node);
        md += "\n\n";
        break;
      case "p":
        traverseInline(node);
        md += "\n\n";
        break;
      case "pre":
        md += "```\n";
        traverseInline(node);
        md += "\n```\n\n";
        break;
      case "ul":
      case "ol":
        const ordered = tag === "ol";
        const items = Array.from(node.querySelectorAll(":scope > li"));
        items.forEach((li, i) => {
          const prefix = ordered ? `${i + 1}. ` : "- ";
          md += prefix;
          traverseInline(li);
          md += "\n";
        });
        md += "\n";
        break;
      case "li":
        return;
      case "blockquote":
        const blockContent = [];
        let blockMd = "";
        const oldMd = md;
        md = "";
        Array.from(node.childNodes).forEach(traverse);
        const quotedText = md;
        md = oldMd;
        quotedText.split("\n").forEach(line => {
          if (line.trim()) md += "> " + line + "\n";
        });
        md += "\n";
        break;
      case "hr":
        md += "---\n\n";
        break;
      case "table":
        const rows = Array.from(node.querySelectorAll("tr"));
        if (rows.length === 0) return;

        rows.forEach((row, rowIdx) => {
          const cells = Array.from(row.querySelectorAll("td, th"));
          md += "| " + cells.map(cell => cell.textContent.trim().replace(/\|/g, "\\|")).join(" | ") + " |\n";

          if (rowIdx === 0) {
            md += "|" + cells.map(() => " --- |").join("") + "\n";
          }
        });
        md += "\n";
        break;
      default:
        Array.from(node.childNodes).forEach(traverse);
    }
  }

  Array.from(body.childNodes).forEach(traverse);
  return md.replace(/\n{3,}/g, "\n\n").trim();
}

function cleanText(text) {
  return text
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function withSource(body) {
  return `Source: ${document.title}\nURL: ${location.href}\n\n${body}`;
}

// Readability needs a cloned DOM since it mutates what it parses.
function extractArticle() {
  try {
    const clone = document.cloneNode(true);
    const article = new Readability(clone).parse();
    if (article && article.content && article.textContent.trim().length >= 200) {
      return { text: withSource(htmlToMarkdown(article.content)), usedFallback: false };
    }
  } catch (e) {
    // fall through to full-page text below
  }
  return { text: withSource(htmlToMarkdown(document.body.innerHTML)), usedFallback: true };
}

function extractFullPage() {
  return withSource(htmlToMarkdown(document.body.innerHTML));
}

function extractSelection() {
  const selection = window.getSelection().toString();
  return selection ? withSource(cleanText(selection)) : "";
}

async function writeToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // http pages / permission issues: ask background to copy via an injected script
    try {
      const res = await browser.runtime.sendMessage({ type: "copy-fallback", text });
      return !!(res && res.ok);
    } catch (e2) {
      return false;
    }
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "ping") {
      sendResponse({ ok: true });
    } else if (message.type === "copy-article") {
      const { text, usedFallback } = extractArticle();
      const copied = await writeToClipboard(text);
      sendResponse({ ok: copied, text, usedFallback, noArticle: !text || text.trim().length === 0 });
    } else if (message.type === "copy-fulltext") {
      const text = extractFullPage();
      const copied = await writeToClipboard(text);
      sendResponse({ ok: copied, text });
    } else if (message.type === "copy-selection") {
      const text = extractSelection();
      if (!text) {
        sendResponse({ ok: false, text: "", noSelection: true });
        return;
      }
      const copied = await writeToClipboard(text);
      sendResponse({ ok: copied, text });
    } else if (message.type === "legacy-copy") {
      const ta = document.createElement("textarea");
      ta.value = message.text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      sendResponse({ ok });
    }
  })();
  return true; // keep the message channel open for the async response
});
