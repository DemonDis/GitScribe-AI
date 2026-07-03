import * as vscode from 'vscode';
import { registerCommitCommands } from './features/commit';
import { registerReadmeCommands } from './features/readme';
import { registerReportCommands } from './features/report';
import { GitScribeTreeProvider } from './ui/treeProvider';

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new GitScribeTreeProvider(context);
  const treeView = vscode.window.createTreeView('gitScribe-sidebar-view', {
    treeDataProvider: treeProvider,
  });

  const commitDisposables = registerCommitCommands(context);
  const readmeDisposables = registerReadmeCommands(context);
  const reportDisposables = registerReportCommands(context);

  context.subscriptions.push(
    treeView,
    ...commitDisposables,
    ...readmeDisposables,
    ...reportDisposables,
  );
}

export function deactivate() {}
