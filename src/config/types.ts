export interface AiConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  prompt?: string;
  gitmoji?: boolean;
  gitProvider?: 'gitlab' | 'github';
  gitlabUrl?: string;
  gitlabToken?: string;
  githubToken?: string;
  rejectUnauthorized?: boolean;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  apiUrl: '',
  apiKey: '',
  model: '',
  prompt: 'Generate a concise git commit message (max 72 characters for title). Analyze this diff and create a semantic commit message:\n\n{diff}\n\nReturn ONLY the commit message, no explanation.',
  gitmoji: false,
  gitProvider: 'gitlab',
  gitlabUrl: '',
  gitlabToken: '',
  githubToken: '',
  rejectUnauthorized: false,
};
