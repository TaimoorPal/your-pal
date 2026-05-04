import * as vscode from 'vscode';
import { detectFramework } from './detector';
import { explainError }    from './explainer';
import { QAExplainerPanel } from './panel';

// ─── Activate ───────────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext) {

  console.log('🎉 Your Pal extension activated successfully!');
  console.log('Extension path:', context.extensionPath);
  console.log('Available commands:', vscode.commands.getCommands().then(cmds => cmds.filter(c => c.includes('qaExplainer'))));

  // ── Command 1: Explain error at cursor (keyboard shortcut) ───
  const explainCmd = vscode.commands.registerCommand(
    'qaExplainer.explain',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a test file first.');
        return;
      }

      // Grab selected text, or the full current line
      const selection = editor.selection;
      const errorText = selection.isEmpty
        ? editor.document.lineAt(selection.active.line).text.trim()
        : editor.document.getText(selection).trim();

      if (!errorText) {
        vscode.window.showWarningMessage('Select an error message or place cursor on an error line.');
        return;
      }

      await runExplainer(errorText, editor.document, context.extensionUri);
    }
  );

  // ── Command 2: Right-click → Explain Selected Error ──────────
  const explainSelectedCmd = vscode.commands.registerCommand(
    'qaExplainer.explainSelected',
    async () => {
      const editor = vscode.window.activeTextEditor;

      // If called from terminal, try clipboard as fallback
      if (!editor) {
        const clip = await vscode.env.clipboard.readText();
        if (clip.trim()) {
          await runExplainer(clip.trim(), undefined, context.extensionUri);
        } else {
          vscode.window.showWarningMessage('Copy the error text first, then try again.');
        }
        return;
      }

      const selection = editor.selection;
      const errorText = editor.document.getText(selection).trim();

      if (!errorText) {
        vscode.window.showWarningMessage('Select the error text first, then right-click.');
        return;
      }

      await runExplainer(errorText, editor.document, context.extensionUri);
    }
  );

  context.subscriptions.push(explainCmd, explainSelectedCmd);
}

// ─── Core logic — shared between both commands ──────────────────
async function runExplainer(
  errorText  : string,
  document   : vscode.TextDocument | undefined,
  extensionUri: vscode.Uri
) {
  // Detect which framework the current file uses
  const framework = detectFramework(document);

  // Open the sidebar panel
  const panel = QAExplainerPanel.createOrShow(extensionUri);

  // Show loading state immediately so the user sees feedback
  panel.showLoading(errorText);

  try {
    // Call MiniMax API
    const explanation = await explainError(errorText, framework);

    // Render the full explanation
    panel.showExplanation(explanation);

    // Also show a status bar notification
    vscode.window.setStatusBarMessage(
      `✅ QA Explainer: ${explanation.errorName} explained`,
      4000
    );

  } catch (err: any) {
    const msg = err?.message ?? 'Unknown error calling MiniMax API';
    panel.showError(msg);
    vscode.window.showErrorMessage(`QA Explainer: ${msg}`);
  }
}

export function deactivate() {}
