import { AiConfig } from '../config/types';
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
      const gitmojiList = GITMOJIS.map(g => `${g.emoji} (${g.code}) - ${g.description}`).join('\n');
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

const GITMOJIS = [
  { emoji: '🎨', code: ':art:', description: 'Improve structure/format of the code' },
  { emoji: '⚡️', code: ':zap:', description: 'Improve performance' },
  { emoji: '🔥', code: ':fire:', description: 'Remove code or files' },
  { emoji: '🐛', code: ':bug:', description: 'Fix a bug' },
  { emoji: '🚑', code: ':ambulance:', description: 'Critical hotfix' },
  { emoji: '✨', code: ':sparkles:', description: 'Introduce new features' },
  { emoji: '📝', code: ':memo:', description: 'Add or update documentation' },
  { emoji: '🚀', code: ':rocket:', description: 'Deploy stuff' },
  { emoji: '💄', code: ':lipstick:', description: 'Add or update the UI and style files' },
  { emoji: '🎉', code: ':tada:', description: 'Begin a project' },
  { emoji: '✅', code: ':white_check_mark:', description: 'Add, update, or pass tests' },
  { emoji: '🔒️', code: ':lock:', description: 'Fix security or privacy issues' },
  { emoji: '🔐', code: ':closed_lock_with_key:', description: 'Add or update secrets' },
  { emoji: '🔖', code: ':bookmark:', description: 'Release/Version tags' },
  { emoji: '🚨', code: ':rotating_light:', description: 'Fix compiler/linter warnings' },
  { emoji: '🚧', code: ':construction:', description: 'Work in progress' },
  { emoji: '💚', code: ':green_heart:', description: 'Fix CI Build' },
  { emoji: '⬇️', code: ':arrow_down:', description: 'Downgrade dependencies' },
  { emoji: '⬆️', code: ':arrow_up:', description: 'Upgrade dependencies' },
  { emoji: '📌', code: ':pushpin:', description: 'Pin dependencies to specific versions' },
  { emoji: '👷', code: ':construction_worker:', description: 'Add or update CI build system' },
  { emoji: '📈', code: ':chart_with_upwards_trend:', description: 'Add or update analytics or track code' },
  { emoji: '♻️', code: ':recycle:', description: 'Refactor code' },
  { emoji: '➕', code: ':heavy_plus_sign:', description: 'Add a dependency' },
  { emoji: '➖', code: ':heavy_minus_sign:', description: 'Remove a dependency' },
  { emoji: '🔧', code: ':wrench:', description: 'Add or update configuration files' },
  { emoji: '🔨', code: ':hammer:', description: 'Add or update development scripts' },
  { emoji: '🌐', code: ':globe_with_meridians:', description: 'Internationalization and localization' },
  { emoji: '✏️', code: ':pencil2:', description: 'Fix typos' },
  { emoji: '💩', code: ':poop:', description: 'Write bad code that needs to be improved' },
  { emoji: '⏪', code: ':rewind:', description: 'Revert changes' },
  { emoji: '🔀', code: ':twisted_rightwards_arrows:', description: 'Merge branches' },
  { emoji: '📦', code: ':package:', description: 'Add or update compiled files or packages' },
  { emoji: '👽️', code: ':alien:', description: 'Update code due to external API changes' },
  { emoji: '🚚', code: ':truck:', description: 'Move or rename resources' },
  { emoji: '📄', code: ':page_facing_up:', description: 'Add or update license' },
  { emoji: '💥', code: ':boom:', description: 'Introduce breaking changes' },
  { emoji: '🍱', code: ':bento:', description: 'Add or update assets' },
  { emoji: '♿️', code: ':wheelchair:', description: 'Improve accessibility' },
  { emoji: '💡', code: ':bulb:', description: 'Add or update comments in source code' },
  { emoji: '💬', code: ':speech_balloon:', description: 'Add or update text and literals' },
  { emoji: '🗃️', code: ':card_file_box:', description: 'Perform database related changes' },
  { emoji: '🔊', code: ':loud_sound:', description: 'Add or update logs' },
  { emoji: '🔇', code: ':mute:', description: 'Remove logs' },
  { emoji: '👥', code: ':busts_in_silhouette:', description: 'Add or update contributor(s)' },
  { emoji: '🚸', code: ':children_crossing:', description: 'Improve user experience/usability' },
  { emoji: '🏗️', code: ':building_construction:', description: 'Make architectural changes' },
  { emoji: '📱', code: ':iphone:', description: 'Work on responsive design' },
  { emoji: '🤡', code: ':clown_face:', description: 'Mock things' },
  { emoji: '🙈', code: ':see_no_evil:', description: 'Add or update a .gitignore file' },
  { emoji: '📸', code: ':camera_flash:', description: 'Add or update snapshots' },
  { emoji: '⚗️', code: ':alembic:', description: 'Perform experiments' },
  { emoji: '🔍', code: ':mag:', description: 'Improve SEO' },
  { emoji: '🏷️', code: ':label:', description: 'Add or update types' },
  { emoji: '🌱', code: ':seedling:', description: 'Add or update seed files' },
  { emoji: '🚩', code: ':triangular_flag_on_post:', description: 'Add, update, or remove feature flags' },
  { emoji: '🥅', code: ':goal_net:', description: 'Catch errors' },
  { emoji: '💫', code: ':dizzy:', description: 'Add or update animations and transitions' },
  { emoji: '🗑️', code: ':wastebasket:', description: 'Deprecate code that needs to be cleaned up' },
  { emoji: '🛂', code: ':passport_control:', description: 'Work on code related to authorization, roles and permissions' },
  { emoji: '🩹', code: ':adhesive_bandage:', description: 'Simple fix for a non-critical issue' },
  { emoji: '🧐', code: ':monocle_face:', description: 'Data exploration/inspection' },
  { emoji: '⚰️', code: ':coffin:', description: 'Remove dead code' },
  { emoji: '🧪', code: ':test_tube:', description: 'Add a failing test' },
  { emoji: '👔', code: ':necktie:', description: 'Add or update business logic' },
  { emoji: '🩺', code: ':stethoscope:', description: 'Add or update healthcheck' },
  { emoji: '🧱', code: ':bricks:', description: 'Infrastructure related changes' },
  { emoji: '🧑‍💻', code: ':technologist:', description: 'Improve developer experience' },
  { emoji: '💸', code: ':money_with_wings:', description: 'Add sponsorships or money related infrastructure' },
  { emoji: '🧵', code: ':thread:', description: 'Add or update code related to multithreading or concurrency' },
  { emoji: '🦺', code: ':safety_vest:', description: 'Add or update code related to validation' },
  { emoji: '✈️', code: ':airplane:', description: 'Improve offline support' },
  { emoji: '🦖', code: ':t-rex:', description: 'Code that adds backwards compatibility' },
];
