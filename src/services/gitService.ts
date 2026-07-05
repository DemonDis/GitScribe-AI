import { simpleGit, SimpleGit } from 'simple-git';

export interface GitDiffSummary {
  isGitRepo: boolean;
  changedFiles: string[];
  addedFiles: string[];
  deletedFiles: string[];
  renamedFiles: string[];
  rawDiff: string;
  hasChanges: boolean;
  baseRef: string;
}

export class GitService {
  private git: SimpleGit;

  constructor(workspacePath: string) {
    this.git = simpleGit(workspacePath);
  }

  async isGitRepository(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  async getStagedDiff(): Promise<{ staged: string[]; diff: string } | null> {
    try {
      const staged = (await this.git.diff(['--cached', '--name-only']))
        .split('\n')
        .filter(f => f.trim().length > 0);

      let diff = '';
      if (staged.length > 0) {
        diff = await this.git.diff(['--cached']);
      } else {
        const changed = (await this.git.diff(['--name-only'])).trim();
        if (changed.length > 0) {
          diff = await this.git.diff();
        }
      }

      return { staged, diff };
    } catch {
      return null;
    }
  }

  async getDiff(baseRef: string = 'HEAD'): Promise<GitDiffSummary> {
    const isGitRepo = await this.isGitRepository();
    if (!isGitRepo) {
      return {
        isGitRepo: false, changedFiles: [], addedFiles: [], deletedFiles: [],
        renamedFiles: [], rawDiff: '', hasChanges: false, baseRef,
      };
    }

    try {
      const rawDiff = await this.git.diff([baseRef]);
      const nameStatus = await this.git.diff(['--name-status', baseRef]);

      const addedFiles: string[] = [];
      const deletedFiles: string[] = [];
      const renamedFiles: string[] = [];
      const changedFiles: string[] = [];

      for (const line of nameStatus.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('A\t')) {
          addedFiles.push(trimmed.slice(2));
        } else if (trimmed.startsWith('D\t')) {
          deletedFiles.push(trimmed.slice(2));
        } else if (trimmed.startsWith('M\t') || trimmed.startsWith('C\t')) {
          changedFiles.push(trimmed.slice(2));
        } else if (trimmed.startsWith('R')) {
          const parts = trimmed.split('\t');
          if (parts.length >= 3) {
            renamedFiles.push(`${parts[1]} -> ${parts[2]}`);
          }
        }
      }

      return {
        isGitRepo: true, changedFiles, addedFiles, deletedFiles,
        renamedFiles, rawDiff, hasChanges: rawDiff.trim().length > 0, baseRef,
      };
    } catch {
      return {
        isGitRepo: true, changedFiles: [], addedFiles: [], deletedFiles: [],
        renamedFiles: [], rawDiff: '', hasChanges: false, baseRef,
      };
    }
  }

  async getRecentTags(limit: number = 5): Promise<string[]> {
    try {
      const tags = await this.git.tags();
      return tags.all.slice(-limit);
    } catch {
      return [];
    }
  }

  async getLastCommitHash(): Promise<string> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      return log.latest?.hash || '';
    } catch {
      return '';
    }
  }

  async getGitAuthorName(): Promise<string> {
    try {
      return await this.git.raw(['config', 'user.name']);
    } catch {
      return 'Неизвестно';
    }
  }

  async getGitAuthorEmail(): Promise<string> {
    try {
      return await this.git.raw(['config', 'user.email']);
    } catch {
      return '';
    }
  }

  async getLog(args: string[]): Promise<string> {
    try {
      return await this.git.raw(args);
    } catch {
      return '';
    }
  }

  async getUncommittedChanges(): Promise<string> {
    const status = await this.git.status();
    if (status.files.length === 0) {
      return 'Нет незакоммиченных изменений';
    }

    const diff = await this.git.diff(['--no-color']);
    const staged = await this.git.diff(['--cached', '--no-color']);

    let result = `=== Статус изменений ===\n${status.files.map(f => `${f.working_dir} ${f.path}`).join('\n')}\n`;
    if (staged) result += `\n=== Индексированные изменения (staged) ===\n${staged}\n`;
    if (diff) result += `\n=== Неиндексированные изменения (unstaged) ===\n${diff}\n`;

    return result;
  }

  async getChangesByDateRange(fromDate: string, toDate: string, authorEmail?: string): Promise<string> {
    const sinceDate = `${fromDate}T00:00:00`;
    const untilDate = `${toDate}T23:59:59`;

    const logArgs = ['log', '--format=%H|%ae|%an|%s', '--no-color'];
    logArgs.push(`--since=${sinceDate}`, `--until=${untilDate}`);

    const log = await this.getLog(logArgs);
    if (!log) return 'Нет коммитов за указанный период';

    const lines = log.split('\n').filter(l => l.trim());
    const commits: { hash: string; email: string; name: string; subject: string }[] = [];

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length < 4) continue;
      const [hash, email, name, ...subjectParts] = parts;
      if (authorEmail && email !== authorEmail) continue;
      commits.push({ hash, email, name, subject: subjectParts.join('|') });
    }

    if (commits.length === 0) return 'Нет коммитов за указанный период';

    let result = `=== Коммиты с ${fromDate} по ${toDate} ===\n`;
    for (const c of commits) {
      result += `${c.hash.substring(0, 8)} ${c.subject} (${c.name} <${c.email}>)\n`;
    }
    result += '\n';

    for (const c of commits) {
      const diff = await this.git.raw(['show', c.hash, '--stat', '--no-color']);
      result += `\n--- Коммит ${c.hash.substring(0, 8)} (${c.name}) ---\n${diff}\n`;
    }

    return result;
  }

  async getChangesByCommits(fromCommit: string, toCommit: string): Promise<string> {
    const log = await this.getLog(['log', '--oneline', `${fromCommit}..${toCommit}`, '--no-color']);
    if (!log) return 'Нет коммитов в указанном диапазоне';

    const diff = await this.getLog(['diff', `${fromCommit}..${toCommit}`, '--no-color']);
    return `=== Коммиты ${fromCommit}..${toCommit} ===\n${log}\n\n=== Изменения ===\n${diff}`;
  }

  formatDiffForAI(diff: GitDiffSummary, maxLength: number = 8000): string {
    let diffText = diff.rawDiff;
    if (diffText.length > maxLength) {
      diffText = diffText.slice(0, maxLength) + '\n... (truncated)';
    }

    return [
      `## Git Diff Summary (base: ${diff.baseRef})`,
      `- Changed files: ${diff.changedFiles.length}`,
      `- Added files: ${diff.addedFiles.length}`,
      `- Deleted files: ${diff.deletedFiles.length}`,
      `- Renamed files: ${diff.renamedFiles.length}`,
      '',
      '### Diff:',
      '```diff',
      diffText,
      '```',
    ].join('\n');
  }

  async getFormattedCommitHistory(baseRef: string, maxLength: number = 8000): Promise<string> {
    try {
      const log = await this.git.log({ from: baseRef, to: 'HEAD' });
      const parts: string[] = ['## Commit History', ''];

      for (const commit of log.all) {
        const header = `### ${commit.hash} ${commit.message}`;
        const date = commit.date ? `*Date: ${commit.date}*` : '';
        const body = commit.body ? `\n${commit.body}` : '';
        const section = [header, date, body].filter(Boolean).join('\n');
        const currentTotal = parts.join('\n\n').length + section.length;

        if (currentTotal > maxLength) {
          parts.push(`... (${log.all.length - parts.length + 1} more commits omitted)`);
          break;
        }
        parts.push(section);
      }

      return parts.join('\n\n');
    } catch {
      return '';
    }
  }
}
