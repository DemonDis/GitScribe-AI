---
name: ai-config
description: Configure AI provider settings for GitScribe AI (OpenAI, Anthropic, etc.)
license: Apache-2.0
compatibility: opencode
metadata:
  audience: developers
  workflow: config
---

## What I do

- Configure AI provider (OpenAI, Anthropic, or custom API endpoint)
- Set API URL, API key, and model selection
- Manage commit prompt template with `{diff}` placeholder
- Switch UI language (English/Русский)
- All settings stored in VS Code `gitscribe.*` preferences

## When to use me

Use this when setting up or changing the AI provider configuration.
Key files:
- Settings panel: `src/ui/settingsPanel.ts`
- Config: `src/config/configService.ts`, `src/config/types.ts`
- AI service: `src/services/aiService.ts`
- i18n: `src/i18n.ts`
