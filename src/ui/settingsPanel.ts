import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

type Lang = 'en' | 'ru';

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: 'GitScribe AI Settings',
    save: 'Save',
    aiProvider: 'AI Provider',
    gitIntegration: 'Git Integration',
    commitPrompt: 'Commit Prompt',
    promptTemplate: 'Prompt template',
    options: 'Options',
    apiUrl: 'API URL',
    apiKey: 'API Key',
    model: 'Model',
    gitProvider: 'Provider',
    gitlabUrl: 'GitLab URL',
    gitlabToken: 'GitLab Token',
    githubToken: 'GitHub Token',
    tlsVerify: 'Disable TLS certificate verification (rejectUnauthorized)',
    gitmoji: 'Use gitmoji in commit messages',
    reportAuthorOnly: 'Report: show only my commits',
    reportAuthorFilter: 'Author email filter',
    reportAuthorFilterPlaceholder: 'email@example.com',
    settingsSaved: 'Settings saved',
    language: 'Language',
    mainSettings: 'Settings',
    prompts: 'Prompts',
    savePrompts: 'Save Prompts',
    restoreDefaults: 'Restore Defaults',
    promptsSaved: 'Prompts saved!',
    promptsRestored: 'Default prompts restored!',
    confirmRestore: 'Restore default prompts? Custom changes will be lost.',
    promptPlaceholder: 'Generate a concise git commit message (max 72 characters for title). Analyze this diff and create a semantic commit message:\n\n{diff}\n\nReturn ONLY the commit message, no explanation.',
    apiUrlPlaceholder: 'https://api.openai.com/v1',
    apiKeyPlaceholder: 'sk-...',
    modelPlaceholder: 'gpt-4o, deepseek-chat, claude-3-sonnet',
    gitlabUrlPlaceholder: 'https://gitlab.com',
    gitlabTokenPlaceholder: 'glpat-...',
    githubTokenPlaceholder: 'ghp_...',
  },
  ru: {
    title: 'GitScribe AI — настройки',
    save: 'Сохранить',
    aiProvider: 'AI провайдер',
    gitIntegration: 'Git интеграция',
    commitPrompt: 'Промт коммита',
    promptTemplate: 'Шаблон промта',
    options: 'Опции',
    apiUrl: 'API URL',
    apiKey: 'API Key',
    model: 'Модель',
    gitProvider: 'Провайдер',
    gitlabUrl: 'GitLab URL',
    gitlabToken: 'GitLab токен',
    githubToken: 'GitHub токен',
    tlsVerify: 'Отключить проверку TLS сертификата (rejectUnauthorized)',
    gitmoji: 'Использовать gitmoji в коммитах',
    reportAuthorOnly: 'Отчёт: только мои коммиты',
    reportAuthorFilter: 'Фильтр по email автора',
    reportAuthorFilterPlaceholder: 'email@example.com',
    settingsSaved: 'Настройки сохранены',
    language: 'Язык',
    mainSettings: 'Настройки',
    prompts: 'Промпты',
    savePrompts: 'Сохранить промпты',
    restoreDefaults: 'Сбросить настройки',
    promptsSaved: 'Промпты сохранены!',
    promptsRestored: 'Промпты сброшены до стандартных!',
    confirmRestore: 'Сбросить промпты до стандартных? Все изменения будут потеряны.',
    promptPlaceholder: 'Generate a concise git commit message (max 72 characters for title). Analyze this diff and create a semantic commit message:\n\n{diff}\n\nReturn ONLY the commit message, no explanation.',
    apiUrlPlaceholder: 'https://api.openai.com/v1',
    apiKeyPlaceholder: 'sk-...',
    modelPlaceholder: 'gpt-4o, deepseek-chat, claude-3-sonnet',
    gitlabUrlPlaceholder: 'https://gitlab.com',
    gitlabTokenPlaceholder: 'glpat-...',
    githubTokenPlaceholder: 'ghp_...',
  },
};

const PROMPT_FILES = [
  'readme.md',
  'update.md',
  'update/readme.md',
  'report.md',
];

export class SettingsPanel {
  public static currentPanel: SettingsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _lang: Lang = 'en';
  private readonly _extensionPath: string;

  private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
    this._extensionPath = extensionPath;
    this._panel = panel;
    const cfg = vscode.workspace.getConfiguration('gitscribe');
    this._lang = (cfg.get<string>('language') as Lang) || 'en';
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
        case 'setLang':
          this._lang = msg.lang as Lang;
          await vscode.workspace.getConfiguration('gitscribe').update('language', this._lang, vscode.ConfigurationTarget.Global);
          this._panel.webview.html = this._getHtml();
          break;
        case 'savePrompts':
          await this._savePrompts(msg);
          break;
        case 'restorePrompts':
          await this._restorePrompts();
          break;
        case 'autoSave':
          await this._autoSaveSettings(msg);
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

    SettingsPanel.currentPanel = new SettingsPanel(panel, context.extensionPath);
  }

  private _loadSettings() {
    const config = vscode.workspace.getConfiguration('gitscribe');
    this._panel.webview.postMessage({
      command: 'setValues',
      values: {
        apiUrl: config.get('apiUrl', ''),
        apiKey: config.get('apiKey', ''),
        model: config.get('model', ''),
        gitProvider: config.get('gitProvider', 'gitlab'),
        gitlabUrl: config.get('gitlabUrl', ''),
        gitlabToken: config.get('gitlabToken', ''),
        githubToken: config.get('githubToken', ''),
        rejectUnauthorized: config.get('rejectUnauthorized', false),
        gitmoji: config.get('gitmoji', false),
        reportAuthorOnly: config.get('reportAuthorOnly', true),
        reportAuthorFilter: config.get('reportAuthorFilter', ''),
        prompt: config.get('prompt', ''),
        language: config.get('language', 'en'),
      }
    });
    this._sendPrompts();
  }

  private _getDefaultPrompts(): Record<string, string> {
    const prompts: Record<string, string> = {};
    for (const file of PROMPT_FILES) {
      const filePath = path.join(this._extensionPath, 'assets', 'prompts', file);
      try {
        prompts[file] = fs.readFileSync(filePath, 'utf-8');
      } catch {
        prompts[file] = '';
      }
    }
    return prompts;
  }

  private _sendPrompts() {
    const customPrompts = vscode.workspace.getConfiguration('gitscribe').get<Record<string, string>>('customPrompts', {});
    const defaults = this._getDefaultPrompts();
    const current: Record<string, string> = {};
    for (const file of PROMPT_FILES) {
      current[file] = customPrompts[file] || defaults[file] || '';
    }
    this._panel.webview.postMessage({
      command: 'setPrompts',
      current,
      defaults,
    });
  }

  private async _saveSettings(msg: any) {
    const config = vscode.workspace.getConfiguration('gitscribe');
    await config.update('apiUrl', msg.apiUrl, vscode.ConfigurationTarget.Global);
    await config.update('apiKey', msg.apiKey, vscode.ConfigurationTarget.Global);
    await config.update('model', msg.model, vscode.ConfigurationTarget.Global);
    await config.update('gitProvider', msg.gitProvider, vscode.ConfigurationTarget.Global);
    await config.update('gitlabUrl', msg.gitlabUrl, vscode.ConfigurationTarget.Global);
    await config.update('gitlabToken', msg.gitlabToken, vscode.ConfigurationTarget.Global);
    await config.update('githubToken', msg.githubToken, vscode.ConfigurationTarget.Global);
    await config.update('rejectUnauthorized', msg.rejectUnauthorized, vscode.ConfigurationTarget.Global);
    await config.update('gitmoji', msg.gitmoji, vscode.ConfigurationTarget.Global);
    await config.update('reportAuthorOnly', msg.reportAuthorOnly, vscode.ConfigurationTarget.Global);
    await config.update('reportAuthorFilter', msg.reportAuthorFilter, vscode.ConfigurationTarget.Global);
    await config.update('prompt', msg.prompt, vscode.ConfigurationTarget.Global);
    await config.update('language', msg.language, vscode.ConfigurationTarget.Global);
    this._lang = msg.language as Lang;
    vscode.window.showInformationMessage(T[this._lang].settingsSaved);
  }

  private async _autoSaveSettings(msg: any) {
    const config = vscode.workspace.getConfiguration('gitscribe');
    const updates: Thenable<void>[] = [];
    
    if (msg.apiUrl !== undefined) updates.push(config.update('apiUrl', msg.apiUrl, vscode.ConfigurationTarget.Global));
    if (msg.apiKey !== undefined) updates.push(config.update('apiKey', msg.apiKey, vscode.ConfigurationTarget.Global));
    if (msg.model !== undefined) updates.push(config.update('model', msg.model, vscode.ConfigurationTarget.Global));
    if (msg.gitProvider !== undefined) updates.push(config.update('gitProvider', msg.gitProvider, vscode.ConfigurationTarget.Global));
    if (msg.gitlabUrl !== undefined) updates.push(config.update('gitlabUrl', msg.gitlabUrl, vscode.ConfigurationTarget.Global));
    if (msg.gitlabToken !== undefined) updates.push(config.update('gitlabToken', msg.gitlabToken, vscode.ConfigurationTarget.Global));
    if (msg.githubToken !== undefined) updates.push(config.update('githubToken', msg.githubToken, vscode.ConfigurationTarget.Global));
    if (msg.rejectUnauthorized !== undefined) updates.push(config.update('rejectUnauthorized', msg.rejectUnauthorized, vscode.ConfigurationTarget.Global));
    if (msg.gitmoji !== undefined) updates.push(config.update('gitmoji', msg.gitmoji, vscode.ConfigurationTarget.Global));
    if (msg.reportAuthorOnly !== undefined) updates.push(config.update('reportAuthorOnly', msg.reportAuthorOnly, vscode.ConfigurationTarget.Global));
    if (msg.reportAuthorFilter !== undefined) updates.push(config.update('reportAuthorFilter', msg.reportAuthorFilter, vscode.ConfigurationTarget.Global));
    if (msg.prompt !== undefined) updates.push(config.update('prompt', msg.prompt, vscode.ConfigurationTarget.Global));
    if (msg.language !== undefined) {
      this._lang = msg.language as Lang;
      updates.push(config.update('language', msg.language, vscode.ConfigurationTarget.Global));
    }
    
    await Promise.all(updates);
  }

  private async _savePrompts(msg: any) {
    const customPrompts: Record<string, string> = {};
    for (const file of PROMPT_FILES) {
      if (msg.prompts && msg.prompts[file] !== undefined) {
        customPrompts[file] = msg.prompts[file];
      }
    }
    await vscode.workspace.getConfiguration('gitscribe').update('customPrompts', customPrompts, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(T[this._lang].promptsSaved);
  }

  private async _restorePrompts() {
    const action = await vscode.window.showWarningMessage(
      T[this._lang].confirmRestore,
      { modal: true },
      T[this._lang].restoreDefaults,
    );
    if (action !== T[this._lang].restoreDefaults) return;

    await vscode.workspace.getConfiguration('gitscribe').update('customPrompts', {}, vscode.ConfigurationTarget.Global);
    this._sendPrompts();
    vscode.window.showInformationMessage(T[this._lang].promptsRestored);
  }

  private _tr(key: string): string {
    return T[this._lang][key] || key;
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="${this._lang}">
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
textarea,
select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-size: 13px;
}
.input-wrap { position: relative; display: flex; align-items: center; }
.input-wrap input { flex: 1; padding-right: 70px; }
.input-wrap .input-actions {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  display: flex; gap: 2px;
}
.input-wrap .input-actions button {
  padding: 2px 6px; font-size: 14px; line-height: 1;
  border: none; background: transparent; color: var(--vscode-input-foreground);
  cursor: pointer; border-radius: 2px; opacity: 0.5; transition: opacity 0.15s;
}
.input-wrap .input-actions button:hover { opacity: 1; background: var(--vscode-list-hoverBackground); }
textarea {
  min-height: 80px;
  max-height: 400px;
  resize: vertical;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.5;
}
input:focus,
textarea:focus,
select:focus {
  outline: 1px solid var(--vscode-focusBorder);
  border-color: var(--vscode-focusBorder);
}
.toggle-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.toggle-btn {
  flex: 1;
  padding: 8px 12px;
  text-align: center;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.toggle-btn.active {
  border-color: var(--vscode-focusBorder);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}
.toggle-btn:hover {
  border-color: var(--vscode-focusBorder);
}
.git-fields { display: none; }
.git-fields.visible { display: block; }
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
  margin-top: 8px;
}
.btn:hover { background: var(--vscode-button-hoverBackground); }
.btn-danger {
  background: var(--vscode-errorForeground, #e74c3c);
}
.btn-danger:hover { opacity: 0.85; }
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
  gap: 12px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lang-select {
  width: auto;
  min-width: 100px;
  padding: 3px 8px;
  font-size: 12px;
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
.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
}
.tab-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: var(--vscode-foreground);
  font-size: 13px;
  cursor: pointer;
  opacity: 0.6;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tab-btn.active {
  opacity: 1;
  border-bottom-color: var(--vscode-focusBorder);
}
.tab-btn:hover { opacity: 0.8; }
.tab-content { display: none; }
.tab-content.active { display: block; }
.prompt-group {
  margin-bottom: 20px;
  padding: 12px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
}
.prompt-group label { font-size: 12px; color: var(--vscode-textPreformat-foreground); }
.prompt-group textarea { min-height: 120px; margin-top: 4px; }
.prompt-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.prompt-actions .btn { margin: 0; }
.prompt-actions .btn-sm { width: auto; }
</style>
</head>
<body>
<div class="header">
<div class="header-left">
<h2>${this._tr('title')}</h2>
</div>
<div class="header-right">
<select class="lang-select" id="language" onchange="setLang()">
<option value="en" ${this._lang === 'en' ? 'selected' : ''}>English</option>
<option value="ru" ${this._lang === 'ru' ? 'selected' : ''}>Русский</option>
</select>
</div>
</div>

<div class="tab-bar">
<button class="tab-btn active" id="tab-settings-btn" onclick="switchTab('settings')">${this._tr('mainSettings')}</button>
<button class="tab-btn" id="tab-prompts-btn" onclick="switchTab('prompts')">${this._tr('prompts')}</button>
</div>

<div class="tab-content active" id="tab-settings">
<div class="section">
<div class="section-title">${this._tr('aiProvider')}</div>
<div class="form-group">
<label for="apiUrl">${this._tr('apiUrl')}</label>
<input type="text" id="apiUrl" placeholder="${this._tr('apiUrlPlaceholder')}" />
</div>
<div class="form-group">
<label for="apiKey">${this._tr('apiKey')}</label>
<div class="input-wrap">
<input type="password" id="apiKey" placeholder="${this._tr('apiKeyPlaceholder')}" />
<div class="input-actions">
<button onclick="togglePassword('apiKey')" title="Show/Hide">👁</button>
<button onclick="copyToClipboard('apiKey')" title="Copy">📋</button>
</div>
</div>
</div>
<div class="form-group">
<label for="model">${this._tr('model')}</label>
<input type="text" id="model" placeholder="${this._tr('modelPlaceholder')}" />
</div>
</div>

<div class="section">
<div class="section-title">${this._tr('gitIntegration')}</div>
<div class="form-group">
<label>${this._tr('gitProvider')}</label>
<div class="toggle-row">
<div class="toggle-btn" id="btn-gitlab" onclick="setProvider('gitlab')">GitLab</div>
<div class="toggle-btn" id="btn-github" onclick="setProvider('github')">GitHub</div>
</div>
</div>
<div class="git-fields" id="gitlab-fields">
<div class="form-group">
<label for="gitlabUrl">${this._tr('gitlabUrl')}</label>
<input type="text" id="gitlabUrl" placeholder="${this._tr('gitlabUrlPlaceholder')}" />
</div>
<div class="form-group">
<label for="gitlabToken">${this._tr('gitlabToken')}</label>
<div class="input-wrap">
<input type="password" id="gitlabToken" placeholder="${this._tr('gitlabTokenPlaceholder')}" />
<div class="input-actions">
<button onclick="togglePassword('gitlabToken')" title="Show/Hide">👁</button>
<button onclick="copyToClipboard('gitlabToken')" title="Copy">📋</button>
</div>
</div>
</div>
</div>
<div class="git-fields" id="github-fields">
<div class="form-group">
<label for="githubToken">${this._tr('githubToken')}</label>
<div class="input-wrap">
<input type="password" id="githubToken" placeholder="${this._tr('githubTokenPlaceholder')}" />
<div class="input-actions">
<button onclick="togglePassword('githubToken')" title="Show/Hide">👁</button>
<button onclick="copyToClipboard('githubToken')" title="Copy">📋</button>
</div>
</div>
</div>
</div>
</div>

<div class="section">
<div class="section-title">${this._tr('commitPrompt')}</div>
<div class="form-group">
<label for="prompt">${this._tr('promptTemplate')}</label>
<textarea id="prompt">${this._tr('promptPlaceholder')}</textarea>
</div>
</div>

<div class="section">
<div class="section-title">${this._tr('options')}</div>
<div class="form-group checkbox-group">
<input type="checkbox" id="rejectUnauthorized" />
<label for="rejectUnauthorized">${this._tr('tlsVerify')}</label>
</div>
<div class="form-group checkbox-group">
<input type="checkbox" id="gitmoji" />
<label for="gitmoji">${this._tr('gitmoji')}</label>
</div>
<div class="form-group checkbox-group">
<input type="checkbox" id="reportAuthorOnly" onchange="toggleAuthorFilter()" />
<label for="reportAuthorOnly">${this._tr('reportAuthorOnly')}</label>
</div>
<div class="form-group" id="reportAuthorFilter-group" style="display:none">
<label for="reportAuthorFilter">${this._tr('reportAuthorFilter')}</label>
<input type="text" id="reportAuthorFilter" placeholder="${this._tr('reportAuthorFilterPlaceholder')}" />
</div>
</div>

</div>

<div class="tab-content" id="tab-prompts">
<div id="prompts-container"></div>
<div class="prompt-actions">
<button class="btn" onclick="savePrompts()">${this._tr('savePrompts')}</button>
<button class="btn btn-danger" onclick="restorePrompts()">${this._tr('restoreDefaults')}</button>
</div>
</div>

<script>
const vscode = acquireVsCodeApi();

// Debounce функция для автосохранения
let autoSaveTimeout = null;
function autoSave(field, value) {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    const msg = { command: 'autoSave' };
    msg[field] = value;
    vscode.postMessage(msg);
  }, 500);
}

function setLang() {
  const lang = document.getElementById('language').value;
  vscode.postMessage({ command: 'setLang', lang: lang });
  autoSave('language', lang);
}

function toggleAuthorFilter() {
  const checked = document.getElementById('reportAuthorOnly').checked;
  document.getElementById('reportAuthorFilter-group').style.display = checked ? 'none' : '';
  autoSave('reportAuthorOnly', checked);
}

function setProvider(provider) {
  document.getElementById('btn-gitlab').classList.toggle('active', provider === 'gitlab');
  document.getElementById('btn-github').classList.toggle('active', provider === 'github');
  document.getElementById('gitlab-fields').classList.toggle('visible', provider === 'gitlab');
  document.getElementById('github-fields').classList.toggle('visible', provider === 'github');
  autoSave('gitProvider', provider);
}

function togglePassword(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

function copyToClipboard(id) {
  const el = document.getElementById(id);
  const val = el.value;
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => {
    const btn = el.parentElement.querySelector('button[onclick*="copyToClipboard"]');
    if (btn) { btn.textContent = '✓'; setTimeout(() => { btn.textContent = '📋'; }, 1500); }
  });
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + name + '-btn').classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

function renderPrompts(current, defaults) {
  const container = document.getElementById('prompts-container');
  container.innerHTML = '';
  for (const [file, content] of Object.entries(current)) {
    const div = document.createElement('div');
    div.className = 'prompt-group';
    div.innerHTML = '<label>' + escapeHtml(file) + '</label>' +
      '<textarea id="prompt-' + escapeHtml(file) + '" data-file="' + escapeHtml(file) + '">' +
      escapeHtml(content) + '</textarea>';
    container.appendChild(div);
  }
}

function savePrompts() {
  const prompts = {};
  document.querySelectorAll('#prompts-container textarea').forEach(ta => {
    prompts[ta.dataset.file] = ta.value;
  });
  vscode.postMessage({ command: 'savePrompts', prompts });
}

function restorePrompts() {
  vscode.postMessage({ command: 'restorePrompts' });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.command === 'setValues') {
    document.getElementById('apiUrl').value = msg.values.apiUrl || '';
    document.getElementById('apiKey').value = msg.values.apiKey || '';
    document.getElementById('model').value = msg.values.model || '';
    document.getElementById('gitlabUrl').value = msg.values.gitlabUrl || '';
    document.getElementById('gitlabToken').value = msg.values.gitlabToken || '';
    document.getElementById('githubToken').value = msg.values.githubToken || '';
    document.getElementById('rejectUnauthorized').checked = msg.values.rejectUnauthorized || false;
    document.getElementById('gitmoji').checked = msg.values.gitmoji || false;
    document.getElementById('reportAuthorOnly').checked = msg.values.reportAuthorOnly !== false;
    document.getElementById('reportAuthorFilter').value = msg.values.reportAuthorFilter || '';
    toggleAuthorFilter();
    document.getElementById('language').value = msg.values.language || 'en';
    setProvider(msg.values.gitProvider || 'gitlab');
    if (msg.values.prompt) {
      document.getElementById('prompt').value = msg.values.prompt;
    }
  }
  if (msg.command === 'setPrompts') {
    renderPrompts(msg.current, msg.defaults);
  }
});

// Добавляем автосохранение при изменении полей
function setupAutoSave() {
  const textFields = ['apiUrl', 'apiKey', 'model', 'gitlabUrl', 'gitlabToken', 'githubToken', 'reportAuthorFilter', 'prompt'];
  textFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => autoSave(id, el.value));
      el.addEventListener('change', () => autoSave(id, el.value));
      el.addEventListener('blur', () => autoSave(id, el.value));
    }
  });
  
  const checkboxFields = ['rejectUnauthorized', 'gitmoji', 'reportAuthorOnly'];
  checkboxFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => autoSave(id, el.checked));
    }
  });
  
  // Селектор языка
  const langSelect = document.getElementById('language');
  if (langSelect) {
    langSelect.addEventListener('change', () => autoSave('language', langSelect.value));
  }
}

setupAutoSave();

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
