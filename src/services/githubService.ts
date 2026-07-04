import * as https from 'https';
import { GitService } from './gitService';

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    committer: {
      name: string;
      date: string;
    };
  };
}

function getRepoPath(gitService: GitService): Promise<{ owner: string; repo: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const url = await gitService.getLog(['remote', 'get-url', 'origin']);
      if (!url) {
        reject(new Error('Failed to get remote origin'));
        return;
      }
      const trimmedUrl = url.trim();
      let path = '';

      if (trimmedUrl.startsWith('git@')) {
        path = trimmedUrl.split(':')[1]?.replace(/\.git$/, '') || '';
      } else if (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://')) {
        const parts = trimmedUrl.split('/');
        path = parts.slice(3).join('/').replace(/\.git$/, '');
      }

      if (!path) {
        reject(new Error('Could not parse project path from remote: ' + trimmedUrl));
        return;
      }

      const parts = path.split('/');
      if (parts.length < 2) {
        reject(new Error('Invalid GitHub remote: ' + trimmedUrl));
        return;
      }

      resolve({ owner: parts[0], repo: parts[1] });
    } catch (err) {
      reject(err);
    }
  });
}

export async function getGitHubCommits(
  token: string,
  owner: string,
  repo: string,
  since: string,
  until: string,
  authorEmail?: string
): Promise<GitHubCommit[]> {
  const urlStr = `https://api.github.com/repos/${owner}/${repo}/commits?since=${since}T00:00:00Z&until=${until}T23:59:59Z&per_page=100${authorEmail ? `&author=${encodeURIComponent(authorEmail)}` : ''}`;
  const url = new URL(urlStr);

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'GitScribe-AI',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`GitHub API error ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const commits: GitHubCommit[] = JSON.parse(data);
          resolve(commits);
        } catch {
          reject(new Error('Failed to parse GitHub response: ' + data));
        }
      });
    }).on('error', (e) => reject(new Error(`GitHub request error: ${e.message}`))).end();
  });
}

export async function getChangesFromGitHub(
  token: string,
  gitService: GitService,
  since: string,
  until: string,
  authorOnly: boolean = false
): Promise<string> {
  const { owner, repo } = await getRepoPath(gitService);

  let authorEmail: string | undefined;
  if (authorOnly) {
    try {
      authorEmail = await gitService.getGitAuthorEmail();
    } catch {
      // ignore
    }
  }

  const commits = await getGitHubCommits(token, owner, repo, since, until, authorEmail);

  if (commits.length === 0) {
    return 'No commits found in GitHub for the specified period';
  }

  let result = `=== GitHub commits (${owner}/${repo}) ===\n`;
  result += `Period: ${since} — ${until}\n\n`;

  for (const c of commits) {
    const msg = c.commit.message.split('\n')[0];
    result += `[${c.sha.slice(0, 8)}] ${msg} — ${c.commit.committer.name} (${c.commit.committer.date.slice(0, 10)})\n`;
  }

  result += '\n=== Full commit messages ===\n';
  for (const c of commits) {
    result += `\n--- ${c.sha.slice(0, 8)} ---\n${c.commit.message.trim()}\n`;
  }

  return result;
}
