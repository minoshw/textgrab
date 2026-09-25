<h1><img src="extension/icons/icon.svg" alt="TextGrab" style="max-height:25px;vertical-align:middle;margin-right:8px"> TextGrab</h1>

Firefox extension to extract clean article/blog text from any webpage and copy it as markdown to your clipboard. Perfect for pasting into Claude, ChatGPT, or any AI tool.

## Quick Start

[🚀 **Install on Firefox Add-ons**](https://addons.mozilla.org/en-US/firefox/addon/textgrab/) • [📥 Download ZIP](https://github.com/minoshw/textgrab/archive/refs/tags/v1.3.2.zip)

## Features

- **Extract Article Text** — Intelligently extracts main article content from webpages
- **Markdown Formatting** — Converts HTML to clean, readable markdown with proper formatting
- **Templates** — Format content for AI tools: Summarize, Explain Simply, Study Questions, Action Items, or Fresh Content
- **Persistent Templates** — Remembers selected template for popup and context-menu copies
- **Stats Display** — See character and word count before copying
- **One-Click Copy** — Single button press from popup or context menu
- **Smart Detection** — Automatically disables on unsupported pages (restricted URLs, login pages, AI tool sites)
- **Instant Feedback** — Shows an animated copying state and confirms when clipboard copy succeeds
- **No Data Collection** — Everything runs locally in your browser. No tracking, no accounts, no servers.

## Privacy

TextGrab only accesses the page when you use it and stores all settings locally in your browser.

**Permissions used:**
- **activeTab** — Access current page content only when you click the toolbar button or context menu
- **clipboardWrite** — Copy extracted content to your clipboard
- **contextMenus** — Add right-click "Copy Page Content" and "Copy Selection" options
- **storage** — Save your template preference locally (no server syncing)

Everything runs locally. Nothing is sent to a server. No tracking, no data collection.

## Supported Markdown Elements

- Headings (h1-h6)
- Paragraphs
- Lists (ordered & unordered)
- Tables
- Bold, italic, strikethrough, underline
- Code blocks & inline code
- Links & images
- Blockquotes
- Horizontal rules

## Installation

### Option 1: Firefox Add-ons Store (Recommended)
[Install TextGrab on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/textgrab/)

1. Click the link above
2. Click **Add to Firefox**
3. Automatic updates included

### Option 2: Manual Load (Development)
[📥 Download v1.3.2](https://github.com/minoshw/textgrab/archive/refs/tags/v1.3.2.zip)

1. Download and extract the ZIP file
2. Open `about:debugging` in Firefox
3. Click **This Firefox** → **Load Temporary Add-on**
4. Open the `extension/` folder and select `manifest.json`

## Usage

### Basic Copy

1. Visit any article, blog post, or webpage
2. Click the TextGrab icon in your toolbar
3. Select a template (optional) from the dropdown
4. Click **Copy Page Content** button
5. The content is copied to clipboard with your chosen template prefix
6. Paste into Claude, ChatGPT, or your AI tool

### Using Templates

TextGrab includes built-in templates to format content for AI tools:

- **Default** — Copy content as-is, no wrapping
- **Summarize** — Prefix: "Summarize the following article in concise bullet points:"
- **Explain Simply** — Prefix: "Explain the following article in simple terms, as if I were a beginner:"
- **Study Questions** — Prefix: "Read the following article and generate 10 study questions with answers:"
- **Action Items** — Prefix: "Extract all action items and tasks from the following article as a checklist:"
- **Fresh Content** — For latest/uncrawled articles: "Here's the current version of this article content since IF you may not have access to the latest:"

### Context Menu

Right-click on any page and select:
- **Copy Page Content** — Extract and copy full article
- **Copy Selection** — Copy selected text

Both options respect your selected template.

### Stats Display

The popup shows character and word count of the current page, helping you gauge content size before copying.

## How It Works

1. **Content Extraction** — Uses Readability algorithm to identify main article content
2. **HTML to Markdown** — Converts extracted HTML to clean markdown format
3. **Clipboard Copy** — Uses native clipboard API with fallback for older browsers
4. **Smart Disable** — Button disables automatically on pages where extraction isn't supported

## Files

```
textgrab/
├── extension/           # The Firefox extension (zip this folder to release)
│   ├── manifest.json    # Extension configuration
│   ├── background.js    # Background service script
│   ├── content.js       # Content script (runs on pages)
│   ├── popup/
│   │   ├── popup.html   # Popup UI
│   │   ├── popup.js     # Popup logic
│   │   └── popup.css    # Popup styling
│   ├── icons/           # Extension icons
│   └── lib/
│       └── Readability.js  # Article extraction library
└── README.md
```

## License

**TextGrab** is licensed under the MIT License (see LICENSE file).

**Readability.js** (included in `lib/Readability.js`) is licensed under the Apache License 2.0. Copyright © 2010 Arc90 Inc.

## Credits

- Built with [Readability.js](https://github.com/mozilla/readability) for intelligent article extraction
- Firefox Readability algorithm for content identification
- Icon: [Chunk 16px - Text](https://www.svgrepo.com/svg/535686/text) by Noah Jacobus (Public Domain)
