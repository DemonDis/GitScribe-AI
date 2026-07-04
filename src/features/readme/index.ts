import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '../../config/configService';
import { RepomixService } from '../../services/repomixService';
import { AiService } from '../../services/aiService';
import { TokenService } from '../../services/tokenService';
import { GitService } from '../../services/gitService';
import { t } from '../../i18n';

const configService = new ConfigService();
const repomixService = new RepomixService();
const aiService = new AiService();
const tokenService = new TokenService();

function getPromptContent(context: vscode.ExtensionContext, promptFile: string): string {
  const promptsPath = path.join(context.extensionPath, 'assets', 'prompts', promptFile);
  return fs.readFileSync(promptsPath, 'utf-8');
}

function createTree(workspacePath: string): string {
  return 'Project tree generation available via Setup command';
}

export function registerReadmeCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const generateCommand = vscode.commands.registerCommand('gitScribe.generateReadme', async (promptFile?: string) => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(t('noWorkspaceFolder'));
      return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    configService.checkOrCreateRepomixConfig(workspacePath);

    const config = configService.readConfig(workspacePath);
    if (!config) {
      vscode.window.showWarningMessage(t('configureFirstPrompt'));
      vscode.commands.executeCommand('gitScribe.openSettings');
      return;
    }

    try {
      vscode.window.showInformationMessage(t('runningRepomix'));

      const outputPath = await repomixService.run(workspacePath);
      vscode.window.showInformationMessage(t('repomixCompleted'));

      const repomixContent = repomixService.readOutput(outputPath);
      const tCount = tokenService.countForQwen(repomixContent);
      vscode.window.showInformationMessage(t('tokenCount').replace('{count}', tCount.toLocaleString()));

      let promptType = getPromptContent(context, 'readme.md');
      if (promptFile) {
        promptType = getPromptContent(context, promptFile);
      }

      vscode.window.showInformationMessage(t('sendingToAi'));
      const readmeContent = await aiService.generateReadme(config, promptType, repomixContent);

      let outputFileName = 'README.md';
      if (promptFile) {
        const baseName = promptFile.replace('.md', '');
        outputFileName = baseName.charAt(0).toUpperCase() + baseName.slice(1) + '.md';
      }

      let readmePath = path.join(workspacePath, outputFileName);
      if (fs.existsSync(readmePath)) {
        const ext = path.extname(outputFileName);
        const base = path.basename(outputFileName, ext);
        let counter = 1;
        do {
          outputFileName = `${base}_${counter}${ext}`;
          readmePath = path.join(workspacePath, outputFileName);
          counter++;
        } while (fs.existsSync(readmePath));
      }

      fs.writeFileSync(readmePath, readmeContent);

      const gitService = new GitService(workspacePath);
      const commitHash = await gitService.getLastCommitHash();
      if (commitHash) {
        fs.appendFileSync(readmePath, `\n\n<!-- git-scribe-ai: ${commitHash} -->`);
      }

      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      vscode.window.showInformationMessage(t('readmeCreated').replace('{file}', outputFileName));

      const doc = await vscode.workspace.openTextDocument(readmePath);
      await vscode.window.showTextDocument(doc);

    } catch (error: any) {
      vscode.window.showErrorMessage(t('errorOccurred').replace('{msg}', error.message));
    }
  });

  const updateCommand = vscode.commands.registerCommand('gitScribe.updateReadme', async () => {
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

    const readmePath = path.join(workspacePath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      vscode.window.showErrorMessage(t('readmeNotFound'));
      return;
    }

    const gitService = new GitService(workspacePath);
    const isGitRepo = await gitService.isGitRepository();
    if (!isGitRepo) {
      vscode.window.showErrorMessage(t('notGitRepo'));
      return;
    }

    const currentReadme = fs.readFileSync(readmePath, 'utf-8');

    const hashMatch = currentReadme.match(/<!-- git-scribe-ai:\s*([a-f0-9]+)\s*-->/i);
    if (!hashMatch) {
      vscode.window.showErrorMessage(t('noCommitHashMarker'));
      return;
    }

    const baseRef = hashMatch[1];
    const readmeWithoutMarker = currentReadme.replace(/<!-- git-scribe-ai:\s*[a-f0-9]+\s*-->\s*/gi, '');

    const diff = await gitService.getDiff(baseRef);

    const headHash = await gitService.getLastCommitHash();
    const isUncommitted = headHash === baseRef && diff.hasChanges;

    const allChangedFiles = [...diff.changedFiles, ...diff.addedFiles, ...diff.deletedFiles, ...diff.renamedFiles];
    const onlyReadmeChanged = allChangedFiles.length > 0 && allChangedFiles.every(f => f === 'README.md');

    if (!diff.hasChanges || onlyReadmeChanged || isUncommitted) {
      const msg = `${t('readmeNotFromGitScribe')} ${baseRef.slice(0, 7)}.`;
      const action = await vscode.window.showWarningMessage(
        msg,
        { modal: true },
        t('updateAnyway'),
      );
      if (action !== t('updateAnyway')) return;
    }

    const DIFF_MAX_SIZE = parseInt(process.env.GITSCRIBE_DIFF_MAX_SIZE || '5000', 10);
    const DIFF_TRUNCATE = parseInt(process.env.GITSCRIBE_DIFF_TRUNCATE || '8000', 10);

    const promptContent = getPromptContent(context, 'update.md');
    let readmeContent: string;

    if (diff.rawDiff.length <= DIFF_MAX_SIZE) {
      const formattedDiff = gitService.formatDiffForAI(diff, DIFF_TRUNCATE);
      const fullContext = `${promptContent}

Below is the current README.md and the code diff. Update the README to reflect the changes in the diff, preserving its style and any manual edits.

Current README.md:
\`\`\`markdown
${readmeWithoutMarker}
\`\`\`

${formattedDiff}`;

      vscode.window.showInformationMessage(t('usingDiffOnly'));
      readmeContent = await aiService.generateReadme(config, '', fullContext);
    } else {
      vscode.window.showInformationMessage(t('runningRepomix'));
      const outputPath = await repomixService.run(workspacePath);
      let repomixContent = repomixService.readOutput(outputPath);
      repomixContent = repomixContent.replace(/<file\s+path="[^"]*README\.md"[^>]*>[\s\S]*?<\/file>\n*/gi, '');
      repomixContent = repomixContent.replace(/^.*README\.md.*\n/gm, '');
      const tCount = tokenService.countForQwen(repomixContent);
      vscode.window.showInformationMessage(t('tokenCount').replace('{count}', tCount.toLocaleString()));

      readmeContent = await aiService.generateReadme(config, promptContent, repomixContent);

      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }

    const newCommitHash = await gitService.getLastCommitHash();
    const resultContent = readmeContent.trimEnd() + `\n\n<!-- git-scribe-ai: ${newCommitHash || baseRef} -->`;
    fs.writeFileSync(readmePath, resultContent);

    vscode.window.showInformationMessage(t('readmeUpdated'));

    const doc = await vscode.workspace.openTextDocument(readmePath);
    await vscode.window.showTextDocument(doc);
  });

  return [generateCommand, updateCommand];
}
