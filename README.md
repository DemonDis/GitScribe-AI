<h1 align="center">GitScribe AI</h1>

<p align="center">
  <img src="assets/logo.png" alt="GitScribe AI" width="350">
</p>

<p align="center">
AI-powered Git assistant for VS Code: commit messages, README generation, and project reports.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-1.85+-007ACC?logo=visualstudiocode" alt="VS Code">
  <img src="https://img.shields.io/badge/version-1.3.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## Features

### Generate Commit Messages
Analyze your staged changes and generate semantic commit messages with optional gitmoji support.

### Generate & Update README
Create a comprehensive README from your project structure, or update an existing one with new changes.

### Generate Reports
Produce detailed project reports summarizing recent changes. Supports uncommitted changes, today's commits, specific date, date range, commit range, and GitLab/GitHub API integration. All date inputs use a native calendar picker.

Filter commits by author — show only your commits, filter by a specific email, or show all.

### Customizable Prompts
Edit all AI prompts directly in the settings panel — commit prompts, README generation prompts, report prompts. Save custom versions or restore defaults anytime.

### Bilingual UI
Switch between English and Russian in the settings panel. All interface elements, notifications, and tree view labels adapt instantly.

### GitLab & GitHub Integration
Fetch commits from GitLab or GitHub API for report generation. Reports tree item expands to show GitLab and GitHub sub-entries.

---

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Ilnsk.git-scribe-ai) or search for "GitScribe AI" in the Extensions view.

## Configuration

1. Open the sidebar and click the **GitScribe AI** icon
2. Click **Settings** to open the configuration panel
3. Configure your AI provider (API URL, API key, model)
4. (Optional) Configure GitLab/GitHub integration for API reports

Or set directly in VS Code settings under `gitscribe.*`.

## Requirements

- VS Code 1.85+
- An API key for your chosen AI provider (e.g., OpenAI, DeepSeek, Anthropic)

No Node.js or other external dependencies required — the extension is fully self-contained.

## Commands

| Command | Description |
|---------|------------|
| `GitScribe AI: Open Settings` | Open configuration panel |
| `GitScribe AI: Generate Commit Message` | Generate a commit message from staged changes |
| `GitScribe AI: Generate README` | Create a new README for your project |
| `GitScribe AI: Update README` | Update existing README with recent changes |
| `GitScribe AI: Generate Report` | Generate a project report (GitLab / GitHub from tree) |

## Settings Panel

The webview-based settings panel includes two tabs:

- **Settings** — AI provider, Git integration, commit prompt, options (gitmoji, author filter), language selector
- **Prompts** — View and edit all prompt files (`readme.md`, `update.md`, `update/readme.md`, `report.md`) with save and restore defaults

Token/key fields feature eye 👁 (show/hide) and copy 📋 buttons for convenience.

## Development

```bash
git clone https://github.com/DemonDis/GitScribe-AI.git
cd GitScribe-AI
npm install
npm run compile
```

Press `F5` in VS Code to launch the extension in debug mode.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
