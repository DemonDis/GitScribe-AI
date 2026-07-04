import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { AiConfig, DEFAULT_AI_CONFIG } from './types';
import { DEFAULT_REPOMIX_CONFIG } from './repomix';

export class ConfigService {
  getIlnskPath(workspacePath: string): string {
    return path.join(workspacePath, '.ilnsk');
  }

  getRepomixConfigPath(workspacePath: string): string {
    return path.join(workspacePath, 'repomix.config.json');
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  readConfig(workspacePath: string): AiConfig | null {
    const vsconfig = vscode.workspace.getConfiguration('gitscribe');
    const apiUrl = vsconfig.get<string>('apiUrl');
    const apiKey = vsconfig.get<string>('apiKey');
    const model = vsconfig.get<string>('model');

    if (apiUrl && apiKey && model) {
      return {
        apiUrl,
        apiKey,
        model,
        gitlabUrl: vsconfig.get<string>('gitlabUrl'),
        gitlabToken: vsconfig.get<string>('gitlabToken'),
        rejectUnauthorized: vsconfig.get<boolean>('rejectUnauthorized', false),
        gitmoji: vsconfig.get<boolean>('gitmoji', false),
        prompt: vsconfig.get<string>('prompt') || DEFAULT_AI_CONFIG.prompt,
      };
    }

    return this.readIlnskConfig(workspacePath);
  }

  readIlnskConfig(workspacePath: string): AiConfig | null {
    const configPath = this.getIlnskPath(workspacePath);
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as AiConfig;
        if (config.apiUrl && config.apiKey && config.model) {
          return config;
        }
        vscode.window.showWarningMessage('Config incomplete. Please fill apiUrl, apiKey, and model in settings or .ilnsk');
        return null;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error reading .ilnsk: ${error}`);
    }
    return null;
  }

  createIlnskConfig(workspacePath: string): void {
    const configPath = this.getIlnskPath(workspacePath);
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_AI_CONFIG, null, 2));
    vscode.window.showInformationMessage(`Config template created at ${configPath}. Please edit it or use Settings panel.`);
  }

  saveIlnskConfig(workspacePath: string, config: AiConfig): void {
    const configPath = this.getIlnskPath(workspacePath);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  checkOrCreateRepomixConfig(workspacePath: string): boolean {
    const configPath = this.getRepomixConfigPath(workspacePath);
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_REPOMIX_CONFIG, null, 2));
      return true;
    }
    return false;
  }
}
