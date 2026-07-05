# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-07-05

### Added
- Calendar date picker for all date inputs in report (native `<input type="date">` via webview)
- Date range picker with both From/To fields in one panel
- "Commits for a specific date" mode in report
- Reports tree item is now collapsible with GitLab/GitHub sub-items
- Author filter setting (`reportAuthorOnly` / `reportAuthorFilter`) — show only my commits, filter by specific email, or show all
- Report panel is reused (no duplicate panels)

### Changed
- Report no longer filters by author by default (all commits shown). Toggle in settings to filter.
- Git service functions now accept `authorEmail?: string` instead of `authorOnly: boolean`
- Report panel reuses existing webview instead of creating new one each time

### Fixed
- Race condition in `pickDate` Promise — `panel.dispose()` was resolving before confirm message
- `workspaceFolders![0]` crash when no workspace open
- Second source picker not showing correctly for local git modes

## [1.1.0] - 2026-07-05

### Added
- Prompts tab in settings panel — view and edit all prompt files (readme.md, update.md, update/readme.md, report.md)
- Save custom prompts to VS Code config (`gitscribe.customPrompts`)
- Restore default prompts with confirmation dialog
- Separate report prompts for GitLab (default) and GitHub sources
- Eye icon 👁 to show/hide token/key fields
- Copy icon 📋 to copy token/key to clipboard

### Changed
- Replaced `repomix` npm dependency with own file packing implementation — extension is fully self-contained
- Moved compilation from `tsc` to esbuild for single-file bundling

### Fixed
- VSIX activation error "filename must be a file URL object..." caused by `repomix` bundling
- Removed unused `openai` dependency

## [1.0.0] - 2026-07-03

### Added
- Initial release
- AI-powered commit message generation
- README generation and update
- Project report generation
- GitLab integration
- VS Code sidebar view with configuration tree
- Bilingual UI (English, Russian)
