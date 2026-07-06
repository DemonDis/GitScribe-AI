import { AiConfig, DEFAULT_GITMOJIS } from '../config/types';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

export interface AiResponse {
  choices: { message?: { content?: string }; text?: string }[];
}

export class AiService {
  async generateText(
    config: AiConfig,
    systemPrompt: string,
    userPrompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const baseUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
    const url = new URL(baseUrl.includes('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`
    );

    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    const body = JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });

    return new Promise((resolve, reject) => {
      const lib = url.protocol === 'https:' ? https : http;
      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        rejectUnauthorized: config.rejectUnauthorized ?? false,
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`API error ${res.statusCode}: ${data}`));
              return;
            }
            const parsed: AiResponse = JSON.parse(data);
            const content =
              parsed.choices?.[0]?.message?.content ||
              parsed.choices?.[0]?.text ||
              '';
            resolve(content || 'Пустой ответ от модели');
          } catch (e) {
            reject(new Error(`Ошибка парсинга ответа: ${data}`));
          }
        });
      });

      req.on('error', (e) => {
        console.error('[AiService] Request error:', e);
        reject(new Error(`Ошибка запроса: ${e.message}`));
      });
      req.write(body);
      req.end();
    });
  }

  async generateCommitMessage(config: AiConfig, diff: string): Promise<string> {
    let promptText = config.prompt || 'Generate a concise git commit message (max 72 characters for title). Analyze this diff and create a semantic commit message:\n\n{diff}\n\nReturn ONLY the commit message, no explanation.';

    if (config.gitmoji) {
      const gitmojiList = (config.gitmojis || DEFAULT_GITMOJIS).map(g => `${g.emoji} (${g.code}) - ${g.description}`).join('\n');
      promptText = `You are generating a git commit message. 
Available gitmojis:
${gitmojiList}

Instructions:
1. Analyze the diff below
2. Choose the most appropriate gitmoji from the list
3. Format: <emoji> <message> (e.g., "✨ Add new feature" or "🐛 Fix login bug")

Diff:
${diff}

Return ONLY the commit message with gitmoji, no explanation.`;
    } else {
      promptText = promptText.replace('{diff}', diff);
    }

    return this.generateText(config, '', promptText, { maxTokens: 200 });
  }

  async generateReadme(
    config: AiConfig,
    prompt: string,
    repomixContent: string
  ): Promise<string> {
    const fullPrompt = `${prompt}

Код проекта:
${repomixContent}

Выведи ТОЛЬКО готовый результат без введений, рассуждений и пояснений.`;
    return this.generateText(config, '', fullPrompt);
  }

  async generateReport(
    config: AiConfig,
    changes: string,
    promptTemplate: string
  ): Promise<string> {
    const prompt = promptTemplate.replace('{changes}', changes);

    return this.generateText(
      config,
      '',
      prompt,
      { temperature: 0.3, maxTokens: 2000 }
    );
  }
}
