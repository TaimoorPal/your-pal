import * as vscode from 'vscode';
import { Explanation, Fix } from './explainer';
import { frameworkLabel } from './detector';

export class QAExplainerPanel {
  public static currentPanel: QAExplainerPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getLoadingHtml();
  }

  // ─── Create or show the panel ────────────────────────────────
  public static createOrShow(extensionUri: vscode.Uri): QAExplainerPanel {
    const column = vscode.ViewColumn.Beside;

    if (QAExplainerPanel.currentPanel) {
      QAExplainerPanel.currentPanel._panel.reveal(column);
      return QAExplainerPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'qaExplainer',
      'Your Pal',
      column,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    QAExplainerPanel.currentPanel = new QAExplainerPanel(panel);
    return QAExplainerPanel.currentPanel;
  }

  // ─── Show loading state ──────────────────────────────────────
  public showLoading(errorPreview: string) {
    this._panel.webview.html = this._getLoadingHtml(errorPreview);
  }

  // ─── Render the full explanation ─────────────────────────────
  public showExplanation(explanation: Explanation) {
    this._panel.webview.html = this._getExplanationHtml(explanation);
  }

  // ─── Show error state ────────────────────────────────────────
  public showError(message: string) {
    this._panel.webview.html = this._getErrorHtml(message);
  }

  // ─── HTML helpers ────────────────────────────────────────────
  private _getLoadingHtml(preview?: string): string {
    return `<!DOCTYPE html>
<html>
<head>${this._styles()}</head>
<body>
  <div class="loading-wrap">
    <div class="spinner"></div>
    <p class="loading-title">Analysing error...</p>
    ${preview ? `<code class="preview">${escHtml(preview.slice(0, 120))}${preview.length > 120 ? '...' : ''}</code>` : ''}
    <p class="loading-sub">Your Pal · Powered by MiniMax M2</p>
  </div>
</body>
</html>`;
  }

  private _getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
<html>
<head>${this._styles()}</head>
<body>
  <div class="error-wrap">
    <div class="error-icon">⚠️</div>
    <p class="error-title">Something went wrong</p>
    <p class="error-msg">${escHtml(message)}</p>
    <p class="error-hint">Check Settings → search "qaExplainer" → make sure your MiniMax API key is set.</p>
  </div>
</body>
</html>`;
  }

  private _getExplanationHtml(ex: Explanation): string {
    const fwLabel = frameworkLabel(ex.framework);
    const fixesHtml = ex.fixes.map((fix, i) => this._fixCard(fix, i + 1)).join('');
    const pwHtml = ex.playwrightEquivalent
      ? this._playwrightCard(ex)
      : '';

    return `<!DOCTYPE html>
<html>
<head>${this._styles()}</head>
<body>

  <div class="header">
    <span class="error-badge">${escHtml(ex.errorName)}</span>
    <span class="fw-badge">${escHtml(fwLabel)}</span>
  </div>

  <div class="card card-teal">
    <div class="card-label">What happened</div>
    <p>${escHtml(ex.whatHappened)}</p>
  </div>

  <div class="card card-amber">
    <div class="card-label">Why it happens</div>
    <p>${escHtml(ex.whyItHappens)}</p>
  </div>

  <div class="section-title">Fixes</div>
  ${fixesHtml}

  ${pwHtml}

  <p class="footer">Your Pal · MiniMax M2 · TaimoorPal</p>

  <script>
    function copyCode(id) {
      const el = document.getElementById(id);
      if (!el) return;
      navigator.clipboard.writeText(el.innerText).then(() => {
        const btn = el.previousElementSibling;
        if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
      });
    }
  </script>
</body>
</html>`;
  }

  private _fixCard(fix: Fix, num: number): string {
    const id = `code-fix-${num}`;
    return `
<div class="card card-purple">
  <div class="card-label">Fix ${num} — ${escHtml(fix.title)}</div>
  <p>${escHtml(fix.description)}</p>
  <div class="code-wrap">
    <button class="copy-btn" onclick="copyCode('${id}')">Copy</button>
    <pre id="${id}" class="code-block language-${fix.language}">${escHtml(fix.code)}</pre>
  </div>
</div>`;
  }

  private _playwrightCard(ex: Explanation): string {
    const pw   = ex.playwrightEquivalent!;
    const id   = 'code-pw';
    const fwFrom = ex.framework === 'selenium-java' ? 'Selenium Java' : 'Selenium Python';
    return `
<div class="pw-section">
  <div class="pw-header">
    <span class="pw-icon">⚡</span>
    <span class="pw-title">Playwright equivalent</span>
    <span class="pw-sub">${escHtml(fwFrom)} → Playwright TypeScript</span>
  </div>

  <div class="card card-green">
    <div class="card-label">How Playwright handles this</div>
    <p>${escHtml(pw.summary)}</p>
  </div>

  <div class="card card-green">
    <div class="card-label">Why this error is rarer in Playwright</div>
    <p>${escHtml(pw.avoidance)}</p>
  </div>

  <div class="card card-green">
    <div class="card-label">Playwright code</div>
    <div class="code-wrap">
      <button class="copy-btn" onclick="copyCode('${id}')">Copy</button>
      <pre id="${id}" class="code-block language-typescript">${escHtml(pw.code)}</pre>
    </div>
  </div>
</div>`;
  }

  // ─── Shared CSS ──────────────────────────────────────────────
  private _styles(): string {
    return `
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12.5px;
    background: #0d0d14;
    color: #c0c0d8;
    padding: 14px;
    line-height: 1.6;
  }

  .header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .error-badge {
    background: #2a1020;
    border: 1px solid #5a2040;
    border-radius: 20px;
    padding: 3px 10px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    color: #ee88cc;
    font-weight: 600;
  }
  .fw-badge {
    background: #0d1a2a;
    border: 1px solid #1a3a5a;
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    color: #6699cc;
  }

  .card {
    border-radius: 8px;
    padding: 10px 13px;
    margin-bottom: 10px;
    border-left: 3px solid transparent;
  }
  .card p { font-size: 12px; color: #a8a8c8; }
  .card-label {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .card-teal  { background: #0a1a1a; border-color: #4ecdc4; }
  .card-teal  .card-label { color: #4ecdc4; }

  .card-amber { background: #1a1500; border-color: #f7b731; }
  .card-amber .card-label { color: #f7b731; }

  .card-purple { background: #100d1a; border-color: #7c6fff; }
  .card-purple .card-label { color: #7c6fff; }

  .card-green { background: #091510; border-color: #4ade80; }
  .card-green .card-label { color: #4ade80; }

  .section-title {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #404060;
    margin-bottom: 8px;
    margin-top: 4px;
  }

  .code-wrap { position: relative; margin-top: 8px; }
  .code-block {
    background: #080810;
    border: 1px solid #1a1a30;
    border-radius: 6px;
    padding: 10px 12px;
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 11px;
    color: #a8dadc;
    white-space: pre-wrap;
    word-break: break-word;
    display: block;
  }
  .copy-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    background: #1a1a35;
    border: 1px solid #2a2a50;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 10px;
    color: #7c6fff;
    cursor: pointer;
    font-family: inherit;
    z-index: 1;
  }
  .copy-btn:hover { background: #25254a; }

  .pw-section {
    border: 1px solid #0e2a1a;
    border-radius: 10px;
    padding: 12px;
    margin-top: 14px;
    background: #050f08;
  }
  .pw-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .pw-icon { font-size: 16px; }
  .pw-title {
    font-size: 12px;
    font-weight: 700;
    color: #4ade80;
    letter-spacing: 0.04em;
  }
  .pw-sub {
    font-size: 10px;
    color: #2a5040;
    margin-left: auto;
  }

  /* Loading */
  .loading-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    gap: 12px;
    text-align: center;
  }
  .spinner {
    width: 28px; height: 28px;
    border: 3px solid #1a1a30;
    border-top-color: #7c6fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-title { color: #8888aa; font-size: 13px; }
  .loading-sub { font-size: 10px; color: #333355; }
  .preview {
    font-family: monospace;
    font-size: 10px;
    color: #555577;
    background: #0d0d1a;
    padding: 6px 10px;
    border-radius: 4px;
    max-width: 100%;
    word-break: break-all;
  }

  /* Error state */
  .error-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 30px 10px;
    gap: 10px;
  }
  .error-icon { font-size: 28px; }
  .error-title { color: #ee8888; font-size: 14px; font-weight: 600; }
  .error-msg { color: #888899; font-size: 12px; max-width: 300px; }
  .error-hint { font-size: 11px; color: #444466; max-width: 280px; }

  .footer {
    font-size: 10px;
    color: #222235;
    text-align: center;
    margin-top: 20px;
    letter-spacing: 0.04em;
  }
</style>`;
  }

  public dispose() {
    QAExplainerPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) { d.dispose(); }
    }
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
