---
name: code-review
description: Review code changes for GitScribe AI extension development
license: Apache-2.0
compatibility: opencode
metadata:
  audience: developers
  workflow: review
---

## What I do

- Review staged or changed files for common issues
- Check TypeScript type safety and compilation (`tsc -p ./`)
- Verify VS Code extension API usage is correct
- Ensure error handling follows project patterns (async try/catch)
- Check that all user-facing strings use `t()` from `src/i18n.ts`
- Verify settings panel webview messages are handled properly
- Ensure configService.readConfig() is used for reading settings

## When to use me

Use this before committing changes or submitting a PR.
Key files to check:
- `src/extension.ts` — entry point, tree view, command registration
- `src/i18n.ts` — all translatable strings
- `src/ui/settingsPanel.ts` — settings webview
- `src/config/types.ts` — AiConfig interface
