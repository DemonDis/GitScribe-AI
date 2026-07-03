<p align="center">
  <img src="img/icon.svg" width="80" alt="GitScribe AI" />
</p>

<h1 align="center">GitScribe AI</h1>

<p align="center">
AI-powered Git assistant for VS Code: commit messages, README generation, and project reports.
</p>

---

## Features

### Generate Commit Messages

Analyze your staged changes and generate semantic commit messages with optional gitmoji support.

### Generate & Update README

Create a comprehensive README from your project structure, or update an existing one with new changes.

### Generate Reports

Produce detailed project reports summarizing your codebase, recent changes, and project health.

### GitLab Integration

Push generated README and reports directly to your GitLab repository.

---

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=git-scribe-ai.git-scribe-ai) or search for "GitScribe AI" in the Extensions view.

## Configuration

1. Open the command palette (`Cmd+Shift+P`) and run **GitScribe AI: Setup Configuration**
2. Configure your AI provider (OpenAI, Anthropic, etc.) and API key
3. (Optional) Configure GitLab integration for publishing

Or set directly in VS Code settings under `gitscribe.*`.

## Requirements

- VS Code 1.85+
- Node.js 20+
- An API key for your chosen AI provider

## Commands

| Command | Description |
|---------|------------|
| `GitScribe AI: Setup Configuration` | Open configuration view |
| `GitScribe AI: Generate Commit Message` | Generate a commit message from staged changes |
| `GitScribe AI: Generate README` | Create a new README for your project |
| `GitScribe AI: Update README` | Update existing README with recent changes |
| `GitScribe AI: Generate Report` | Generate a project report |
| `GitScribe AI: Edit Prompt` | Customize the AI prompt |

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

[Apache 2.0](LICENSE)
