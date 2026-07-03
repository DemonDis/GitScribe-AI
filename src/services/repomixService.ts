import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { pack } from 'repomix';

const outputChannel = vscode.window.createOutputChannel('GitScribe AI');

export class RepomixService {
  async run(workspacePath: string): Promise<string> {
    try {
      outputChannel.appendLine('Starting repomix...');

      const configPath = path.join(workspacePath, 'repomix.config.json');
      let config: any = {};

      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
      }

      const outputPath = path.join(workspacePath, 'repomix-output.xml');

      await pack(
        [workspacePath],
        {
          ...config,
          cwd: workspacePath,
          output: {
            filePath: 'repomix-output.xml',
            style: 'xml',
            filePathStyle: 'cwd-relative',
            includeEmptyFiles: false,
            includeFileSignature: true,
            includeSummary: true,
            showLineNumbers: true,
          },
          ignore: {
            useGitignore: true,
            useDefaultPatterns: true,
            customPatterns: config['ignore']?.customPatterns || [
              '!**/node_modules/**',
              '!**/.git/**',
              '!**/.ilnsk',
              '!**/.env/*',
              '!**/.env'
            ],
          },
        } as any,
        (progress: string) => {
          if (progress.includes('Done') || progress.includes('Complete')) {
            outputChannel.appendLine(progress);
          }
        }
      );

      if (fs.existsSync(outputPath)) {
        outputChannel.appendLine('Repomix completed');
        return outputPath;
      }
      throw new Error('Repomix output not found');
    } catch (error: any) {
      outputChannel.appendLine(`Error: ${error.message}`);
      throw new Error(`Repomix error: ${error.message}`);
    }
  }

  readOutput(outputPath: string): string {
    return fs.readFileSync(outputPath, 'utf-8');
  }
}
