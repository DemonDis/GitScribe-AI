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
- Set API keys, model selection, temperature, and max tokens
- Manage prompt templates for commit messages, README, and reports
- Update `gitscribe.*` VS Code settings

## When to use me

Use this when setting up or changing the AI provider configuration.
Check `src/config/` and `src/services/aiService.ts` for available options.
