import * as vscode from 'vscode';
import { registerCommitCommands } from './features/commit';
import { registerReadmeCommands } from './features/readme';
import { registerReportCommands } from './features/report';
import { GitScribeTreeProvider } from './ui/treeProvider';
import { SettingsPanel } from './ui/settingsPanel';
import { getLang } from './i18n';

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new GitScribeTreeProvider();
  const treeView = vscode.window.createTreeView('gitScribe-sidebar-view', {
    treeDataProvider: treeProvider,
  });

  const commitDisposables = registerCommitCommands(context);
  const readmeDisposables = registerReadmeCommands(context);
  const reportDisposables = registerReportCommands(context);

  const settingsCommand = vscode.commands.registerCommand('gitScribe.openSettings', () => {
    SettingsPanel.createOrShow();
  });

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('gitscribe.language')) {
      getLang();
      treeProvider.refresh();
    }
  });

  context.subscriptions.push(
    treeView,
    settingsCommand,
    configListener,
    ...commitDisposables,
    ...readmeDisposables,
    ...reportDisposables,
  );
}

export function deactivate() {}
