import * as vscode from 'vscode';
import { t } from '../i18n';

function createTreeItem(label: string, command: string, icon: string): vscode.TreeItem {
  const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
  item.iconPath = new vscode.ThemeIcon(icon);
  item.command = {
    command,
    title: label,
  };
  return item;
}

export class GitScribeTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (!element) {
      const settingsItem = createTreeItem(t('settings'), 'gitScribe.openSettings', 'gear');
      const readmeItem = createTreeItem(t('generateReadme'), 'gitScribe.generateReadme', 'files');
      const readmeUpdateItem = createTreeItem(t('updateReadme'), 'gitScribe.updateReadme', 'sync');
      const reportItem = createTreeItem(t('reports'), 'gitScribe.generateReport', 'report');

      return [settingsItem, readmeItem, readmeUpdateItem, reportItem];
    }

    return [];
  }
}
