---
name: extension-setup
description: Initial setup and configuration of GitScribe AI VS Code extension
license: Apache-2.0
compatibility: opencode
metadata:
  audience: developers
  workflow: setup
---

## What I do

- Guide through initial extension setup
- Configure AI provider (API URL, key, model)
- Set up repomix integration for code analysis
- Configure Git provider (GitLab or GitHub) for commit fetching
- Customize commit prompt template
- Switch language (English/Русский) for UI and notifications
- Test that the extension compiles and runs correctly

## When to use me

Use this when setting up the extension for the first time or after a fresh clone.
Key files:
- Settings panel: `src/ui/settingsPanel.ts`
- Config service: `src/config/configService.ts`
- i18n: `src/i18n.ts`
