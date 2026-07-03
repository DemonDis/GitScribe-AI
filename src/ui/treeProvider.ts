import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function getPromptFiles(context: vscode.ExtensionContext, folder: string = ''): string[] {
  const promptsPath = folder
    ? path.join(context.extensionPath, 'src', 'prompts', folder)
    : path.join(context.extensionPath, 'src', 'prompts');
  try {
    const files = fs.readdirSync(promptsPath).filter(f => f.endsWith('.md'));
    return files;
  } catch {
    return [];
  }
}

function createTreeItem(label: string, command: string, icon: string, args?: any[]): vscode.TreeItem {
  const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
  item.iconPath = new vscode.ThemeIcon(icon);
  item.command = {
    command,
    title: label,
    arguments: args,
  };
  return item;
}

export class GitScribeTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  constructor(private context: vscode.ExtensionContext) {}

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (!element) {
      const setupItem = createTreeItem('⚙️ Setup', 'gitScribe.setup', 'gear');
      const commitItem = createTreeItem('📝 Commits', 'gitScribe.generateCommit', 'git-commit');
      const readmeGenerateItem = createTreeItem('📖 Generate README', 'gitScribe.generateReadme', 'files');
      const readmeUpdateItem = createTreeItem('📖 Update README', 'gitScribe.updateReadme', 'sync');
      const reportItem = createTreeItem('📊 Reports', 'gitScribe.generateReport', 'report');

      const readmeItem = new vscode.TreeItem('📖 README', vscode.TreeItemCollapsibleState.Collapsed);
      readmeItem.iconPath = new vscode.ThemeIcon('file-text');
      readmeItem.contextValue = 'readme';

      const editPromptsItem = new vscode.TreeItem('✏️ Edit Prompts', vscode.TreeItemCollapsibleState.Collapsed);
      editPromptsItem.iconPath = new vscode.ThemeIcon('edit');
      editPromptsItem.contextValue = 'editPrompts';

      return [setupItem, commitItem, readmeItem, reportItem, editPromptsItem];
    }

    if (element.contextValue === 'readme') {
      const generateItem = createTreeItem('Generate', 'gitScribe.generateReadme', 'files');
      const updateItem = createTreeItem('Update', 'gitScribe.updateReadme', 'sync');
      const promptFiles = getPromptFiles(this.context)
        .filter(file => file !== 'update.md' && file !== 'readme.md')
        .map(file =>
          createTreeItem(file.replace('.md', ''), 'gitScribe.generateReadme', 'file-text', [file])
        );
      return [generateItem, updateItem, ...promptFiles];
    }

    if (element.contextValue === 'editPrompts') {
      const promptFiles = getPromptFiles(this.context)
        .filter(file => file !== 'readme.md')
        .map(file =>
          createTreeItem(file.replace('.md', ''), 'gitScribe.editPrompt', 'file-text', [file, ''])
        );
      const updatePromptFiles = getPromptFiles(this.context, 'update')
        .map(file =>
          createTreeItem(`update/${file.replace('.md', '')}`, 'gitScribe.editPrompt', 'file-text', [file, 'update'])
        );
      return [...promptFiles, ...updatePromptFiles];
    }

    return [];
  }
}
