# Your Pal

Your QA companion inside VS Code. Explains Selenium and Playwright errors in plain English using MiniMax AI — and shows the Playwright equivalent whenever you are using Selenium.

Built by **Taimoor Ahmed Pal** — Senior Automation Engineer, ISTQB CTFL Certified.

## What it does

You hit a `NoSuchElementException` or `locator.click: Timeout` in your test. Instead of spending 30 minutes on Google, you press `Cmd+Shift+E` (or right-click → Explain QA Error) and within 2 seconds the sidebar shows:

- **What happened** — plain English, no jargon
- **Why it happens** — the actual root cause specific to your framework
- **3 fixes** — copy-paste ready code in your exact language (Java, Python, or TypeScript)
- **Playwright equivalent** — when you are using Selenium, it also shows how Playwright handles the same scenario and why this error is rarer in Playwright

## Supported frameworks

| Framework | File types |
|---|---|
| Selenium Java | `.java` |
| Selenium Python | `.py` with Selenium imports |
| Playwright TypeScript | `.spec.ts`, `.test.ts` |
| Playwright Python | `.py` with Playwright imports |

## How to use

**Option 1 — Keyboard shortcut**
Place your cursor on any error line → press `Cmd+Shift+E` (Mac) or `Ctrl+Shift+E` (Windows)

**Option 2 — Right-click**
Select any error text in the editor or terminal → right-click → Explain QA Error

**Option 3 — Select and explain**
Highlight a full stack trace → right-click → Explain Selected Error

## Setup

1. Install the extension
2. Open Settings (`Cmd+,`) and search `qaExplainer`
3. Paste your MiniMax API key — get one free at [platform.minimax.io](https://platform.minimax.io)
4. Done — no other configuration needed

## The Playwright equivalent feature

When the extension detects you are in a Selenium file, the explanation panel adds a green section at the bottom:

- A summary of how Playwright handles the same scenario differently
- Why this specific error is less common or avoided in Playwright
- The equivalent Playwright TypeScript code ready to copy

This is useful for QA engineers learning Playwright or working in teams that use both frameworks.

## Example errors it explains

- `NoSuchElementException` — Selenium Java and Python
- `StaleElementReferenceException`
- `ElementClickInterceptedException`
- `TimeoutException` and `WebDriverTimeoutException`
- `locator.click: Timeout exceeded` — Playwright
- `Error: page.goto: net::ERR_CONNECTION_REFUSED` — Playwright
- `NullPointerException` in test setup
- `SessionNotCreatedException`
- Any custom Python or Java exception in a test file

## Powered by MiniMax M2

Uses the MiniMax M2 model — a 229B parameter model with function calling support. Compatible with the OpenAI SDK. MiniMax is the AI behind ChatGPT's advanced voice mode (via LiveKit).

## Author

Taimoor Ahmed Pal
Senior Automation Engineer · AI Test Engineer · ISTQB CTFL Certified
[GitHub](https://github.com/TaimoorPal) · Lahore, Pakistan
