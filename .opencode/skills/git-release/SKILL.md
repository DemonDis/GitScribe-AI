---
name: git-release
description: Create consistent releases, tags, and changelogs for GitScribe AI
license: Apache-2.0
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I do

- Draft release notes from merged PRs
- Propose a version bump based on commit history
- Provide a copy-pasteable `gh release create` command
- Generate `.vsix` package instructions for VS Code Marketplace

## When to use me

Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.

## Release workflow

1. Ensure all changes are committed and pushed
2. Create a tag: `git tag v<version> && git push origin v<version>`
3. GitHub Actions builds and publishes the release automatically
