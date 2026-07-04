---
name: gitlab-sync
description: Configure Git provider integration (GitLab/GitHub) for fetching commits and publishing
license: Apache-2.0
compatibility: opencode
metadata:
  audience: developers
  workflow: ci
---

## What I do

- Configure Git provider (GitLab or GitHub) connection
- GitLab: URL + personal access token
- GitHub: personal access token (classic, repo scope)
- Fetch commits via API for reports
- Push generated README and reports

## When to use me

Use this when setting up Git provider integration.
- GitLab: `src/services/gitlabService.ts`
- GitHub: `src/services/githubService.ts`
- Provider toggle in settings panel (`src/ui/settingsPanel.ts`)
