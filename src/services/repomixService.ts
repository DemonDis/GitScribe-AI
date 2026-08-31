import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.vscode', '.opencode',
  'dist', 'build', 'coverage', '.next',
  '__pycache__', '.venv', 'venv', 'env',
]);

const MAX_FILE_SIZE = 100 * 1024;
const MAX_TOTAL_SIZE = 2 * 1024 * 1024;

interface RepomixConfig {
  include?: string[];
  ignore?: {
    customPatterns?: string[];
  };
}

export class RepomixService {
  async run(workspacePath: string): Promise<string> {
    const config = this.loadConfig(workspacePath);
    const allFiles = this.collectAllFiles(workspacePath, workspacePath);
    const files = this.filterFiles(allFiles, config);

    const outputPath = path.join(workspacePath, 'repomix-output.xml');
    let totalSize = 0;

    const parts: string[] = ['<project>'];

    for (const relPath of files) {
      const absPath = path.join(workspacePath, relPath);
      try {
        const stat = fs.statSync(absPath);
        if (!stat.isFile() || stat.size > MAX_FILE_SIZE) continue;

        const content = fs.readFileSync(absPath, 'utf-8');
        if (totalSize + content.length > MAX_TOTAL_SIZE) break;
        totalSize += content.length;

        parts.push(`<file path="${relPath}">`);
        parts.push(escapeXml(content));
        parts.push('</file>');
      } catch {
        // skip inaccessible files
      }
    }

    parts.push('</project>');
    const result = parts.join('\n');
    fs.writeFileSync(outputPath, result, 'utf-8');
    return outputPath;
  }

  readOutput(outputPath: string): string {
    return fs.readFileSync(outputPath, 'utf-8');
  }

  private loadConfig(workspacePath: string): RepomixConfig {
    const configPath = path.join(workspacePath, 'repomix.config.json');
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as RepomixConfig;
      }
    } catch {
      // invalid or unreadable config, fall back to defaults
    }
    return {};
  }

  private correctPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  private collectAllFiles(rootDir: string, currentDir: string): string[] {
    const result: string[] = [];
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const relPath = path.relative(rootDir, path.join(currentDir, entry.name));
        const rel = this.correctPath(relPath);
        if (entry.isDirectory()) {
          if (DEFAULT_IGNORE_DIRS.has(entry.name)) continue;
          result.push(...this.collectAllFiles(rootDir, path.join(currentDir, entry.name)));
        } else {
          result.push(rel);
        }
      }
    } catch {
      // skip inaccessible directories
    }
    return result;
  }

  private filterFiles(files: string[], config: RepomixConfig): string[] {
    const customPatterns = config.ignore?.customPatterns ?? [];
    const includePatterns = config.include && config.include.length > 0 ? config.include : null;

    const isDefaultInclude = includePatterns === null ||
      (includePatterns.length === 1 && includePatterns[0] === '**/*');

    return files.filter((file) => {
      const base = file.split('/').pop() ?? '';
      if (base === 'repomix.config.json' || base === 'repomix-output.xml') return false;

      const inIncludeZone = isDefaultInclude || includePatterns!.some((pattern) => this.matchPattern(file, pattern));
      if (!inIncludeZone) return false;

      if (customPatterns.some((pattern) => this.matchPattern(file, pattern))) return false;

      for (const seg of file.split('/')) {
        if (seg.startsWith('.') && DEFAULT_IGNORE_DIRS.has(seg)) return false;
      }
      return true;
    });
  }

  private matchPattern(filePath: string, pattern: string): boolean {
    const p = this.correctPath(pattern);

    if (p === '' || p === '**' || p === '/') return true;

    const hasSlash = p.includes('/');

    if (p.includes('**')) {
      const isDirPattern = p.endsWith('/');
      const trimmed = p.replace(/\/+$/, '');
      const source = this.globToRegexSource(trimmed, true);
      if (isDirPattern) {
        return new RegExp(`^${source}(/.*)?$`).test(filePath);
      }
      return new RegExp(`^${source}$`).test(filePath);
    }

    if (!hasSlash) {
      if (filePath === p) return true;
      const baseName = filePath.split('/').pop() ?? '';
      return this.compareSegment(baseName, p);
    }

    if (p.endsWith('/')) {
      return filePath.startsWith(p);
    }

    if (p.includes('*') || p.includes('?')) {
      const re = this.globToRegexSource(p, false);
      return new RegExp(`^${re}$`).test(filePath);
    }

    return filePath === p;
  }

  private globToRegexSource(pattern: string, globstar: boolean): string {
    let re = '';
    let i = 0;
    while (i < pattern.length) {
      const ch = pattern[i];
      if (ch === '*') {
        if (globstar && pattern[i + 1] === '*') {
          re += '.*';
          i += 2;
          if (pattern[i] === '/') i++; // swallow following slash for **/
          continue;
        }
        re += '[^/]*';
        i++;
      } else if (ch === '?') {
        re += '[^/]';
        i++;
      } else if ('+^${}()|[\\]'.includes(ch)) {
        re += '\\' + ch;
        i++;
      } else {
        re += ch;
        i++;
      }
    }
    return re;
  }

  private compareSegment(name: string, pattern: string): boolean {
    if (!pattern.includes('*') && !pattern.includes('?')) {
      return name === pattern;
    }
    const re = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${re}$`).test(name);
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
