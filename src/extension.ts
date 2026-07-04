import * as vscode from 'vscode';
import { registerCommitCommands } from './features/commit';
import { registerReadmeCommands } from './features/readme';
import { registerReportCommands } from './features/report';
import { GitScribeTreeProvider } from './ui/treeProvider';
import { SettingsPanel } from './ui/settingsPanel';

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new GitScribeTreeProvider();
  const treeView = vscode.window.createTreeView('gitScribe-sidebar-view', {
    treeDataProvider: treeProvider,
  });

  const commitDisposables = registerCommitCommands(context);
  const readmeDisposables = registerReadmeCommands(context);
  const reportDisposables = registerReportCommands(context);

  const settingsCommand = vscode.commands.registerCommand('gitScribe.openSettings', () => {
    SettingsPanel.createOrShow(context);
  });

  context.subscriptions.push(
    treeView,
    settingsCommand,
    ...commitDisposables,
    ...readmeDisposables,
    ...reportDisposables,
  );
}

export function deactivate() {}
