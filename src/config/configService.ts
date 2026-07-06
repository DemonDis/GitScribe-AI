import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { AiConfig, DEFAULT_AI_CONFIG, Gitmoji } from './types';
import { DEFAULT_REPOMIX_CONFIG } from './repomix';
import { t } from '../i18n';

export class ConfigService {
  private getIlnskPath(workspacePath: string): string {
    return path.join(workspacePath, '.ilnsk');
  }

  getRepomixConfigPath(workspacePath: string): string {
    return path.join(workspacePath, 'repomix.config.json');
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  private readIlnskConfig(workspacePath: string): AiConfig | null {
    const configPath = this.getIlnskPath(workspacePath);
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as AiConfig;
        if (config.apiUrl && config.apiKey && config.model) {
          return config;
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`${t('errorReadingConfig')} ${error}`);
    }
    return null;
  }

  private readVsConfig(): AiConfig | null {
    const vsconfig = vscode.workspace.getConfiguration('gitscribe');
    const apiUrl = vsconfig.get<string>('apiUrl');
    const apiKey = vsconfig.get<string>('apiKey');
    const model = vsconfig.get<string>('model');

    if (!apiUrl || !apiKey || !model) {
      return null;
    }

    return {
      apiUrl,
      apiKey,
      model,
      gitProvider: (vsconfig.get<string>('gitProvider') as 'gitlab' | 'github') || 'gitlab',
      gitlabUrl: vsconfig.get<string>('gitlabUrl'),
      gitlabToken: vsconfig.get<string>('gitlabToken'),
      githubToken: vsconfig.get<string>('githubToken'),
      rejectUnauthorized: vsconfig.get<boolean>('rejectUnauthorized', false),
      gitmoji: vsconfig.get<boolean>('gitmoji', false),
      gitmojis: vsconfig.get<Gitmoji[]>('gitmojis') || undefined,
      prompt: vsconfig.get<string>('prompt') || DEFAULT_AI_CONFIG.prompt,
    };
  }

  readConfig(workspacePath: string): AiConfig | null {
    return this.readIlnskConfig(workspacePath) || this.readVsConfig();
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
