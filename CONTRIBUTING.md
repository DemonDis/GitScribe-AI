# Contributing to GitScribe AI

We're thrilled you're interested in contributing to GitScribe AI. Whether you're fixing a bug, adding a feature, or improving our docs, every contribution makes GitScribe AI better!

## Reporting Bugs or Issues

Bug reports help make GitScribe AI better for everyone! Before creating a new issue, please [search existing ones](https://github.com/DemonDis/GitScribe-AI/issues) to avoid duplicates. When you're ready to report a bug, head over to our [issues page](https://github.com/DemonDis/GitScribe-AI/issues/new/choose).

> **Important:** If you discover a security vulnerability, please use the [GitHub security tool to report it privately](https://github.com/DemonDis/GitScribe-AI/security/advisories/new).

## Before Contributing

All contributions must begin with a GitHub Issue, unless the change is for small bug fixes, typo corrections, minor wording improvements, or simple type fixes that don't change functionality.
**For features and contributions**:
- First check the [Feature Requests discussions](https://github.com/DemonDis/GitScribe-AI/discussions/categories/feature-requests) for similar ideas
- If your idea is new, create a new feature request
- Wait for approval from core maintainers before starting implementation
- Once approved, feel free to begin working on a PR!

**PRs without approved issues may be closed.**

## Deciding What to Work On

Looking for a good first contribution? Check out issues labeled ["good first issue"](https://github.com/DemonDis/GitScribe-AI/labels/good%20first%20issue) or ["help wanted"](https://github.com/DemonDis/GitScribe-AI/labels/help%20wanted).

## Development Setup

### Local Development Instructions

1. Clone the repository:
    ```bash
    git clone https://github.com/DemonDis/GitScribe-AI.git
    ```
2. Open the project in VS Code:
    ```bash
    code GitScribe-AI
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Compile TypeScript:
    ```bash
    npm run compile
    ```
5. Launch by pressing `F5` (or `Run` -> `Start Debugging`) to open a new VS Code window with the extension loaded.

### Creating a Pull Request

1. Commit your changes.
2. Push your branch and create a PR on GitHub.
3. Ensure your code compiles without errors:
    ```bash
    npm run compile
    ```

## Writing and Submitting Code

Anyone can contribute code to GitScribe AI, but we ask that you follow these guidelines:

1. **Keep Pull Requests Focused**
   - Limit PRs to a single feature or bug fix
   - Split larger changes into smaller, related PRs

2. **Code Quality**
   - Follow TypeScript best practices and maintain type safety
   - Ensure your code compiles cleanly

3. **Testing**
   - Add tests for new features when possible
   - Run `npm test` to ensure all tests pass

4. **Commit Guidelines**
   - Write clear, descriptive commit messages
   - Use conventional commit format (e.g., "feat:", "fix:", "docs:")
   - Reference relevant issues using #issue-number

5. **Before Submitting**
   - Rebase your branch on the latest main
   - Ensure your branch compiles successfully
   - Review your changes for any debugging code or console logs

6. **Pull Request Description**
   - Clearly describe what your changes do
   - Include steps to test the changes
   - List any breaking changes

## Contribution Agreement

By submitting a pull request, you agree that your contributions will be licensed under the same license as the project ([Apache 2.0](LICENSE)).
