import * as vscode from 'vscode';

export class SettingsPanel {
  public static currentPanel: SettingsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._panel.webview.html = this._getHtml();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.command) {
        case 'save':
          await this._saveSettings(msg);
          break;
        case 'load':
          this._loadSettings();
          break;
      }
    }, null, this._disposables);
  }

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel._panel.reveal(column);
      SettingsPanel.currentPanel._loadSettings();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'gitScribeSettings',
      'GitScribe AI Settings',
      column || vscode.ViewColumn.One,
      { enableScripts: true }
    );

    SettingsPanel.currentPanel = new SettingsPanel(panel, context);
  }

  private _loadSettings() {
    const config = vscode.workspace.getConfiguration('gitscribe');
    this._panel.webview.postMessage({
      command: 'setValues',
      values: {
        apiUrl: config.get('apiUrl', ''),
        apiKey: config.get('apiKey', ''),
        model: config.get('model', ''),
        gitlabUrl: config.get('gitlabUrl', ''),
        gitlabToken: config.get('gitlabToken', ''),
        rejectUnauthorized: config.get('rejectUnauthorized', false),
        gitmoji: config.get('gitmoji', false),
        prompt: config.get('prompt', ''),
      }
    });
  }

  private async _saveSettings(msg: any) {
    const config = vscode.workspace.getConfiguration('gitscribe');
    await config.update('apiUrl', msg.apiUrl, vscode.ConfigurationTarget.Global);
    await config.update('apiKey', msg.apiKey, vscode.ConfigurationTarget.Global);
    await config.update('model', msg.model, vscode.ConfigurationTarget.Global);
    await config.update('gitlabUrl', msg.gitlabUrl, vscode.ConfigurationTarget.Global);
    await config.update('gitlabToken', msg.gitlabToken, vscode.ConfigurationTarget.Global);
    await config.update('rejectUnauthorized', msg.rejectUnauthorized, vscode.ConfigurationTarget.Global);
    await config.update('gitmoji', msg.gitmoji, vscode.ConfigurationTarget.Global);
    await config.update('prompt', msg.prompt, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage('Settings saved!');
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
}
.form-group { margin-bottom: 16px; }
label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vscode-settings-labelForeground);
}
input[type="text"],
input[type="password"],
textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-size: 13px;
}
textarea {
  min-height: 80px;
  max-height: 400px;
  resize: vertical;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.5;
}
input:focus,
textarea:focus {
  outline: 1px solid var(--vscode-focusBorder);
  border-color: var(--vscode-focusBorder);
}
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.checkbox-group input { width: 16px; height: 16px; }
.checkbox-group label { margin: 0; cursor: pointer; }
.btn {
  width: 100%;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  font-size: 13px;
  cursor: pointer;
}
.btn:hover { background: var(--vscode-button-hoverBackground); }
h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.btn-sm {
  width: auto;
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  font-size: 12px;
  cursor: pointer;
}
.btn-sm:hover { background: var(--vscode-button-hoverBackground); }
.section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--vscode-panelTitle-activeForeground);
  margin-bottom: 12px;
}
</style>
</head>
<body>
<div class="header">
<h2>GitScribe AI Settings</h2>
<button class="btn-sm" onclick="save()">Save</button>
</div>

<div class="section">
<div class="section-title">AI Provider</div>
<div class="form-group">
<label for="apiUrl">API URL</label>
<input type="text" id="apiUrl" placeholder="https://api.openai.com/v1" />
</div>
<div class="form-group">
<label for="apiKey">API Key</label>
<input type="password" id="apiKey" placeholder="sk-..." />
</div>
<div class="form-group">
<label for="model">Model</label>
<input type="text" id="model" placeholder="gpt-4o, deepseek-chat, claude-3-sonnet" />
</div>
</div>

<div class="section">
<div class="section-title">GitLab</div>
<div class="form-group">
<label for="gitlabUrl">GitLab URL</label>
<input type="text" id="gitlabUrl" placeholder="https://gitlab.com" />
</div>
<div class="form-group">
<label for="gitlabToken">GitLab Token</label>
<input type="password" id="gitlabToken" placeholder="glpat-..." />
</div>
</div>

<div class="section">
<div class="section-title">Commit Prompt</div>
<div class="form-group">
<label for="prompt">Prompt template</label>
<textarea id="prompt">Generate a concise git commit message (max 72 characters for title). Analyze this diff and create a semantic commit message:

{diff}

Return ONLY the commit message, no explanation.</textarea>
</div>
</div>

<div class="section">
<div class="section-title">Options</div>
<div class="form-group checkbox-group">
<input type="checkbox" id="rejectUnauthorized" />
<label for="rejectUnauthorized">Disable TLS certificate verification (rejectUnauthorized)</label>
</div>
<div class="form-group checkbox-group">
<input type="checkbox" id="gitmoji" />
<label for="gitmoji">Use gitmoji in commit messages</label>
</div>
</div>

<button class="btn" onclick="save()">Save</button>

<script>
const vscode = acquireVsCodeApi();

document.getElementById('apiUrl').addEventListener('input', () => vscode.postMessage({ command: 'preview' }));
document.getElementById('apiKey').addEventListener('input', () => {});
document.getElementById('model').addEventListener('input', () => {});

window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.command === 'setValues') {
    document.getElementById('apiUrl').value = msg.values.apiUrl || '';
    document.getElementById('apiKey').value = msg.values.apiKey || '';
    document.getElementById('model').value = msg.values.model || '';
    document.getElementById('gitlabUrl').value = msg.values.gitlabUrl || '';
    document.getElementById('gitlabToken').value = msg.values.gitlabToken || '';
    document.getElementById('rejectUnauthorized').checked = msg.values.rejectUnauthorized || false;
    document.getElementById('gitmoji').checked = msg.values.gitmoji || false;
    if (msg.values.prompt) {
      document.getElementById('prompt').value = msg.values.prompt;
    }
  }
});
function save() {
  vscode.postMessage({
    command: 'save',
    apiUrl: document.getElementById('apiUrl').value,
    apiKey: document.getElementById('apiKey').value,
    model: document.getElementById('model').value,
    gitlabUrl: document.getElementById('gitlabUrl').value,
    gitlabToken: document.getElementById('gitlabToken').value,
    rejectUnauthorized: document.getElementById('rejectUnauthorized').checked,
    gitmoji: document.getElementById('gitmoji').checked,
    prompt: document.getElementById('prompt').value,
  });
}
vscode.postMessage({ command: 'load' });
</script>
</body>
</html>`;
  }

  public dispose() {
    SettingsPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
