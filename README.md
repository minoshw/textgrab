# TextGrab

Firefox extension to extract clean article/blog text from any webpage and copy it as markdown to your clipboard. Perfect for pasting into Claude, ChatGPT, or any AI tool.

## Quick Start

[📥 **Download v1.1.1**](https://github.com/minoshw/textgrab/archive/refs/tags/v1.1.1.zip) • [📖 Installation Guide](#installation)

## Features

- **Extract Article Text** — Intelligently extracts main article content from webpages
- **Markdown Formatting** — Converts HTML to clean, readable markdown with proper formatting
- **One-Click Copy** — Single button press to copy content to clipboard
- **Smart Detection** — Automatically disables on unsupported pages (restricted URLs, iframes, etc.)
- **Instant Feedback** — Shows "✓ Copied to clipboard" when successful
- **No Data Collection** — Everything runs locally in your browser. No tracking, no accounts, no servers.

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

### Option 1: Temporary Load (Development)
[📥 Download v1.1.1](https://github.com/minoshw/textgrab/archive/refs/tags/v1.1.1.zip)

1. Download and extract the ZIP file
2. Open `about:debugging` in Firefox
3. Click **This Firefox** → **Load Temporary Add-on**
4. Select `manifest.json` from the extracted folder

### Option 2: Mozilla-Signed & Self-Hosted (Recommended)
Get Mozilla's signature and distribute yourself:

1. Go to [addons.mozilla.org/submit](https://addons.mozilla.org/en-US/developers/addon/submit/distribution)
2. Log in or create an account
3. Upload this repository or `.zip` file
4. Fill in store metadata (description, screenshots, etc.)
5. Submit for review (unlisted)
6. Mozilla signs the `.xpi` file
7. Download the signed `.xpi` from Developer Hub
8. Host it on your own server/GitHub
9. Firefox automatically checks `update_url` for updates

**Update URL Setup:**
- Edit `manifest.json` and add your update URL
- Firefox checks this URL for new versions
- Serve an XML update manifest with signed `.xpi` links

## Usage

1. Visit any article, blog post, or webpage
2. Click the TextGrab icon in your toolbar
3. Click **Copy Content** button
4. The page content is copied to clipboard as markdown
5. Paste into Claude, ChatGPT, or your favorite AI tool

## Technical Details

- **Manifest Version:** 2
- **Security:** Content Security Policy enabled (script-src 'self')
- **No Permissions Collected:** Zero telemetry
- **Icon Sizes:** 32px and 64px (Firefox standard)
- **Version:** 1.1.1

## How It Works

1. **Content Extraction** — Uses Readability algorithm to identify main article content
2. **HTML to Markdown** — Converts extracted HTML to clean markdown format
3. **Clipboard Copy** — Uses native clipboard API with fallback for older browsers
4. **Smart Disable** — Button disables automatically on pages where extraction isn't supported

## Files

```
textgrab/
├── manifest.json          # Extension configuration
├── background.js          # Background service script
├── content.js            # Content script (runs on pages)
├── popup/
│   ├── popup.html        # Popup UI
│   ├── popup.js          # Popup logic
│   └── popup.css         # Popup styling
├── icons/                # Extension icons
├── lib/
│   └── Readability.js    # Article extraction library
└── README.md
```

## License

**TextGrab** is licensed under the MIT License (see LICENSE file).

**Readability.js** (included in `lib/Readability.js`) is licensed under the Apache License 2.0. Copyright © 2010 Arc90 Inc.

## Credits

- Built with [Readability.js](https://github.com/mozilla/readability) for intelligent article extraction
- Firefox Readability algorithm for content identification
