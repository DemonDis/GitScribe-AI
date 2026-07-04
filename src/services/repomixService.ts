import * as fs from 'fs';
import * as path from 'path';

const IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.vscode', '.opencode',
  'dist', 'build', 'coverage', '.next',
  '__pycache__', '.venv', 'venv', 'env',
]);

const MAX_FILE_SIZE = 100 * 1024;
const MAX_TOTAL_SIZE = 2 * 1024 * 1024;

export class RepomixService {
  async run(workspacePath: string): Promise<string> {
    const outputPath = path.join(workspacePath, 'repomix-output.xml');
    const files = this.collectFiles(workspacePath, workspacePath);
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

  private collectFiles(rootDir: string, currentDir: string): string[] {
    const result: string[] = [];
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        const relPath = path.relative(rootDir, path.join(currentDir, entry.name));
        if (entry.isDirectory()) {
          result.push(...this.collectFiles(rootDir, path.join(currentDir, entry.name)));
        } else {
          result.push(relPath);
        }
      }
    } catch {
      // skip inaccessible directories
    }
    return result;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
