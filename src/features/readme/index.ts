import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '../../config/configService';
import { RepomixService } from '../../services/repomixService';
import { AiService } from '../../services/aiService';
import { TokenService } from '../../services/tokenService';
import { GitService } from '../../services/gitService';

const configService = new ConfigService();
const repomixService = new RepomixService();
const aiService = new AiService();
const tokenService = new TokenService();

function getPromptContent(context: vscode.ExtensionContext, promptFile: string): string {
  const promptsPath = path.join(context.extensionPath, 'src', 'prompts', promptFile);
  return fs.readFileSync(promptsPath, 'utf-8');
}

function createTree(workspacePath: string): string {
  return 'Project tree generation available via Setup command';
}

export function registerReadmeCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const generateCommand = vscode.commands.registerCommand('gitScribe.generateReadme', async (promptFile?: string) => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    const wasCreated = configService.checkOrCreateRepomixConfig(workspacePath);

    let config = configService.readIlnskConfig(workspacePath);
    if (!config) {
      configService.createIlnskConfig(workspacePath);
      vscode.window.showWarningMessage('Created default .ilnsk config. Please configure and run again.');
      return;
    }

    if (!config.apiUrl || !config.apiKey || !config.model) {
      vscode.window.showWarningMessage('Please configure .ilnsk settings first.');
      vscode.commands.executeCommand('gitScribe.setup');
      return;
    }

    try {
      vscode.window.showInformationMessage('Running repomix...');

      const outputPath = await repomixService.run(workspacePath);
      vscode.window.showInformationMessage('Repomix completed');

      const repomixContent = repomixService.readOutput(outputPath);
      const tCount = tokenService.countForQwen(repomixContent);
      vscode.window.showInformationMessage(`Token count: ${tCount.toLocaleString()}`);

      let promptType = getPromptContent(context, 'readme.md');
      if (promptFile) {
        promptType = getPromptContent(context, promptFile);
      }

      vscode.window.showInformationMessage('Sending to AI...');
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

      vscode.window.showInformationMessage(`${outputFileName} created successfully!`);

      const doc = await vscode.workspace.openTextDocument(readmePath);
      await vscode.window.showTextDocument(doc);

    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  });

  const updateCommand = vscode.commands.registerCommand('gitScribe.updateReadme', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;

    let config = configService.readIlnskConfig(workspacePath);
    if (!config) {
      configService.createIlnskConfig(workspacePath);
      vscode.window.showWarningMessage('Created default .ilnsk config. Please configure and run again.');
      return;
    }

    if (!config.apiUrl || !config.apiKey || !config.model) {
      vscode.window.showWarningMessage('Please configure .ilnsk settings first.');
      vscode.commands.executeCommand('gitScribe.setup');
      return;
    }

    const readmePath = path.join(workspacePath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      vscode.window.showErrorMessage('README.md not found. Generate one first.');
      return;
    }

    const gitService = new GitService(workspacePath);
    const isGitRepo = await gitService.isGitRepository();
    if (!isGitRepo) {
      vscode.window.showErrorMessage('Not a git repository');
      return;
    }

    const currentReadme = fs.readFileSync(readmePath, 'utf-8');

    const hashMatch = currentReadme.match(/<!-- git-scribe-ai:\s*([a-f0-9]+)\s*-->/i);
    if (!hashMatch) {
      vscode.window.showErrorMessage('README.md was not generated by GitScribe AI. Missing commit hash marker.');
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
      const action = await vscode.window.showWarningMessage(
        `No code changes detected since ${baseRef.slice(0, 7)}. Force update anyway?`,
        { modal: true },
        'Force Update',
      );
      if (action !== 'Force Update') return;
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

      vscode.window.showInformationMessage('Using diff-only mode...');
      readmeContent = await aiService.generateReadme(config, '', fullContext);
    } else {
      vscode.window.showInformationMessage('Running repomix...');
      const outputPath = await repomixService.run(workspacePath);
      let repomixContent = repomixService.readOutput(outputPath);
      repomixContent = repomixContent.replace(/<file\s+path="[^"]*README\.md"[^>]*>[\s\S]*?<\/file>\n*/gi, '');
      repomixContent = repomixContent.replace(/^.*README\.md.*\n/gm, '');
      const tCount = tokenService.countForQwen(repomixContent);
      vscode.window.showInformationMessage(`Token count: ${tCount.toLocaleString()}`);

      readmeContent = await aiService.generateReadme(config, promptContent, repomixContent);

      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }

    const newCommitHash = await gitService.getLastCommitHash();
    const resultContent = readmeContent.trimEnd() + `\n\n<!-- git-scribe-ai: ${newCommitHash || baseRef} -->`;
    fs.writeFileSync(readmePath, resultContent);

    vscode.window.showInformationMessage('README.md updated successfully!');

    const doc = await vscode.workspace.openTextDocument(readmePath);
    await vscode.window.showTextDocument(doc);
  });

  const editPromptCommand = vscode.commands.registerCommand('gitScribe.editPrompt', async (promptFile: string, folder: string = '') => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const promptsPath = folder
      ? path.join(context.extensionPath, 'src', 'prompts', folder, promptFile)
      : path.join(context.extensionPath, 'src', 'prompts', promptFile);

    if (!fs.existsSync(promptsPath)) {
      vscode.window.showErrorMessage(`Prompt file not found: ${promptFile}`);
      return;
    }

    const doc = await vscode.workspace.openTextDocument(promptsPath);
    const editor = await vscode.window.showTextDocument(doc);

    const saveListener = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
      if (savedDoc.uri.fsPath === promptsPath) {
        vscode.window.showInformationMessage(`Prompt saved: ${promptFile}`);
      }
    });

    context.subscriptions.push(saveListener);
  });

  return [generateCommand, updateCommand, editPromptCommand];
}
