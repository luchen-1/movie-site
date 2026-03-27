# Repository Guidelines

## Project Structure & Module Organization
This repository is currently empty. As code is added, keep the layout predictable:

- `src/` for application or library code
- `tests/` for automated tests
- `assets/` for static files such as images or sample data
- `docs/` for design notes and contributor-facing documentation

Organize modules by feature or domain, not by file type alone. Example: `src/auth/login.*` and `tests/auth/login.test.*`.

## Build, Test, and Development Commands
No build or test toolchain is configured yet. When one is introduced, expose the main workflows through documented commands at the repository root.

- `git status` checks the current worktree before changes are committed
- `git diff --stat` gives a quick review of edited files
- `git add <path>` stages a focused change set

If you add a language-specific toolchain, prefer a single entry point such as `make test`, `npm test`, or `pytest` and document it here.

## Coding Style & Naming Conventions
Use UTF-8 text files and 4 spaces for indentation unless the chosen language has a stronger community convention. Keep filenames lowercase with separators that fit the stack, such as `snake_case.py`, `kebab-case.ts`, or `MyClass.java` for types only.

Favor small modules, clear function names, and minimal comments. Add formatters and linters early and run them before opening a pull request.

## Testing Guidelines
Place tests under `tests/` and mirror the source layout. Use names that make scope obvious, such as `tests/auth/test_login.py` or `tests/auth/login.test.ts`.

Add tests with every behavior change or bug fix. Until a framework is selected, treat missing automated coverage as a gap that should be called out in reviews.

## Commit & Pull Request Guidelines
This directory is not yet a Git repository, so there is no local commit history to copy. Use short, imperative commit messages such as `Add initial auth module` or `Fix login validation`.

Pull requests should include a brief summary, the reason for the change, test evidence, and screenshots only when UI behavior is affected. Keep PRs small enough to review in one pass.
