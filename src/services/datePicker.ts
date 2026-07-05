import * as vscode from 'vscode';

const today = new Date().toISOString().split('T')[0];

function createPanel(title: string, bodyHtml: string): vscode.WebviewPanel {
  return vscode.window.createWebviewPanel(
    'gitScribeDatePicker',
    title,
    vscode.ViewColumn.Active,
    { enableScripts: true }
  );
}

function wrapHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1e1e1e; color: #d4d4d4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    label { font-size: 12px; color: #888; margin-bottom: 4px; display: block; }
    input[type="date"] { font-size: 18px; padding: 8px 12px; border: 1px solid #555; border-radius: 4px; background: #2d2d2d; color: #d4d4d4; width: 220px; box-sizing: border-box; }
    .field { margin-bottom: 16px; text-align: center; }
    button { font-size: 14px; padding: 8px 24px; border: none; border-radius: 4px; background: #0e639c; color: #fff; cursor: pointer; }
    button:hover { background: #1177bb; }
    button.secondary { background: #3c3c3c; margin-left: 8px; }
    button.secondary:hover { background: #4c4c4c; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function setupPanel<T>(
  panel: vscode.WebviewPanel,
  resolve: (value: T | undefined) => void,
  parse?: (raw: unknown) => T
) {
  let resolved = false;

  panel.webview.onDidReceiveMessage((msg) => {
    if (resolved) return;
    resolved = true;
    if (msg.type === 'confirm') {
      resolve(parse ? parse(msg.value) : (msg.value as T));
    } else {
      resolve(undefined);
    }
    panel.dispose();
  });

  panel.onDidDispose(() => {
    if (!resolved) {
      resolved = true;
      resolve(undefined);
    }
  });
}

export async function pickDate(title: string): Promise<string | undefined> {
  return new Promise<string | undefined>((resolve) => {
    const panel = createPanel(title, '');

    panel.webview.html = wrapHtml(`
  <div class="field">
    <input type="date" id="date" value="${today}" />
  </div>
  <div>
    <button onclick="confirm()">OK</button>
    <button class="secondary" onclick="cancel()">Cancel</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    function confirm() { vscode.postMessage({ type: 'confirm', value: document.getElementById('date').value }); }
    function cancel() { vscode.postMessage({ type: 'cancel' }); }
    document.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); });
    document.getElementById('date').focus();
  </script>`);

    setupPanel(panel, resolve);
  });
}

export async function pickDateRange(title: string): Promise<{ from: string; to: string } | undefined> {
  return new Promise<{ from: string; to: string } | undefined>((resolve) => {
    const panel = createPanel(title, '');

    panel.webview.html = wrapHtml(`
  <div class="field">
    <label>From</label>
    <input type="date" id="from" value="${today}" />
  </div>
  <div class="field">
    <label>To</label>
    <input type="date" id="to" value="${today}" />
  </div>
  <div>
    <button onclick="confirm()">OK</button>
    <button class="secondary" onclick="cancel()">Cancel</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    function confirm() { vscode.postMessage({ type: 'confirm', value: JSON.stringify({ from: document.getElementById('from').value, to: document.getElementById('to').value }) }); }
    function cancel() { vscode.postMessage({ type: 'cancel' }); }
    document.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); });
    document.getElementById('from').focus();
  </script>`);

    setupPanel(panel, resolve, (raw) => JSON.parse(raw as string));
  });
}
