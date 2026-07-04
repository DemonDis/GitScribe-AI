---
name: gitlab-sync
description: Configure and sync GitLab integration for publishing README and reports
license: Apache-2.0
compatibility: opencode
metadata:
  audience: developers
  workflow: ci
---

## What I do

- Configure GitLab repository connection (URL, token, project ID)
- Push generated README and reports to GitLab
- Manage GitLab publish settings

## When to use me

Use this when setting up GitLab publishing for generated documents.
Check `src/services/gitlabService.ts` for API details.
