import * as vscode from 'vscode';

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
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (!element) {
      const settingsItem = createTreeItem('Settings', 'gitScribe.openSettings', 'gear');
      const readmeItem = createTreeItem('Generate README', 'gitScribe.generateReadme', 'files');
      const readmeUpdateItem = createTreeItem('Update README', 'gitScribe.updateReadme', 'sync');
      const reportItem = createTreeItem('Reports', 'gitScribe.generateReport', 'report');

      return [settingsItem, readmeItem, readmeUpdateItem, reportItem];
    }

    return [];
  }
}
