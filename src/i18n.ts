import * as vscode from 'vscode';

export type Lang = 'en' | 'ru';

export const T: Record<Lang, Record<string, string>> = {
  en: {
    settings: 'Settings',
    generateReadme: 'Generate README',
    updateReadme: 'Update README',
    reports: 'Reports',
    uncommitted: 'Uncommitted changes',
    today: 'Commits today',
    dateRange: 'Commits by date range',
    betweenCommits: 'Changes between commits',
    gitlabCommits: 'GitLab commits (API)',
    selectSource: 'Select changes source for report',
    startDate: 'Start date (e.g., 2024-01-01)',
    endDate: 'End date (e.g., 2024-12-31)',
    startCommit: 'Start commit (hash or branch)',
    endCommit: 'End commit (hash or branch)',
    enterDate: 'Enter date',
    enterCommit: 'Enter commit',
    generatingReport: 'Generating AI report...',
    configureFirst: 'Please configure settings first',
    gitlabTokenMissing: 'Please set gitlabToken in .ilnsk',
    reportGenerated: 'Report generated',
  },
  ru: {
    settings: 'Настройки',
    generateReadme: 'Сгенерировать README',
    updateReadme: 'Обновить README',
    reports: 'Отчёты',
    uncommitted: 'Незакоммиченные изменения',
    today: 'Коммиты сегодня',
    dateRange: 'Коммиты за период',
    betweenCommits: 'Изменения между коммитами',
    gitlabCommits: 'Коммиты GitLab (API)',
    selectSource: 'Выберите источник изменений для отчёта',
    startDate: 'Начальная дата (например, 2024-01-01)',
    endDate: 'Конечная дата (например, 2024-12-31)',
    startCommit: 'Начальный коммит (хэш или ветка)',
    endCommit: 'Конечный коммит (хэш или ветка)',
    enterDate: 'Введите дату',
    enterCommit: 'Введите коммит',
    generatingReport: 'Генерация AI отчёта...',
    configureFirst: 'Сначала настройте параметры',
    gitlabTokenMissing: 'Укажите gitlabToken в .ilnsk',
    reportGenerated: 'Отчёт сгенерирован',
  },
};

export function getLang(): Lang {
  const cfg = vscode.workspace.getConfiguration('gitscribe');
  return (cfg.get<string>('language') as Lang) || 'en';
}

export function t(key: string): string {
  const lang = getLang();
  return T[lang][key] || key;
}
