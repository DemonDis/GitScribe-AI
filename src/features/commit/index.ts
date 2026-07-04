import * as vscode from 'vscode';
import { ConfigService } from '../../config/configService';
import { AiService } from '../../services/aiService';
import { GitService } from '../../services/gitService';
import { t } from '../../i18n';

const configService = new ConfigService();
const aiService = new AiService();

export function registerCommitCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const setupCommand = vscode.commands.registerCommand('gitScribe.setup', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(t('noWorkspaceFolder'));
      return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;

    const apiUrl = await vscode.window.showInputBox({
      title: 'GitScribe AI - API URL',
      prompt: 'Enter API URL (e.g., https://api.openai.com/v1)'
    });
    if (!apiUrl) return;

    const apiKey = await vscode.window.showInputBox({
      title: 'GitScribe AI - API Key',
      password: true,
      prompt: 'Enter API Key'
    });
    if (!apiKey) return;

    const model = await vscode.window.showInputBox({
      title: 'GitScribe AI - Model',
      prompt: 'Enter model name (e.g., gpt-4o, deepseek-chat)'
    });
    if (!model) return;

    const gitmoji = await vscode.window.showQuickPick(['Yes', 'No'], {
      title: 'Enable Gitmoji?'
    });

    const config = {
      apiUrl, apiKey, model,
      gitmoji: gitmoji === 'Yes',
      rejectUnauthorized: false,
    };

    configService.saveIlnskConfig(workspacePath, config as any);
    vscode.window.showInformationMessage(t('gitScribeConfigured'));
  });

  const generateCommand = vscode.commands.registerCommand('gitScribe.generateCommit', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(t('noWorkspaceFolder'));
      return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;

    const config = configService.readConfig(workspacePath);
    if (!config) {
      configService.createIlnskConfig(workspacePath);
      return;
    }

    try {
      const gitService = new GitService(workspacePath);
      const commitInfo = await gitService.getStagedDiff();

      if (!commitInfo || !commitInfo.diff) {
        vscode.window.showWarningMessage(t('noChangesFound'));
        return;
      }

      vscode.window.showInformationMessage(t('generatingCommit'));
      const message = await aiService.generateCommitMessage(config, commitInfo.diff);

      try {
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (gitExtension && gitExtension.exports) {
          const gitApi = gitExtension.exports.getAPI(1);
          if (gitApi.repositories && gitApi.repositories.length > 0) {
            const repo = gitApi.repositories[0];
            if (repo.inputBox) {
              repo.inputBox.value = message;
              vscode.window.showInformationMessage(t('commitAddedToScm'));
              return;
            }
          }
        }
      } catch (e) {
        console.log('Git API error:', e);
      }

      await vscode.env.clipboard.writeText(message);
      vscode.window.showInformationMessage(t('commitCopied').replace('{msg}', message));
    } catch (error: any) {
      vscode.window.showErrorMessage(error.message || t('failedToGenerateCommit'));
    }
  });

  return [setupCommand, generateCommand];
}
