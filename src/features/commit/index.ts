import * as vscode from 'vscode';
import { ConfigService } from '../../config/configService';
import { AiService } from '../../services/aiService';
import { GitService } from '../../services/gitService';
import { t } from '../../i18n';

const configService = new ConfigService();
const aiService = new AiService();

export function registerCommitCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const generateCommand = vscode.commands.registerCommand('gitScribe.generateCommit', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(t('noWorkspaceFolder'));
      return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;

    const config = configService.readConfig(workspacePath);
    if (!config) {
      vscode.window.showWarningMessage(t('configureFirstPrompt'));
      vscode.commands.executeCommand('gitScribe.openSettings');
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

  return [generateCommand];
}
