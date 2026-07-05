# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-07-05

### Added
- Prompts tab in settings panel — view and edit all prompt files (readme.md, update.md, update/readme.md)
- Save custom prompts to VS Code config (`gitscribe.customPrompts`)
- Restore default prompts with confirmation dialog
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
- GitLab and GitHub integration
- VS Code sidebar view with configuration tree
- Bilingual UI (English, Russian)
