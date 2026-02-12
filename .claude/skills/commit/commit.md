---
description: Create git commits following Conventional Commits v1.0.0
user-invocable: true
---

# Commit Messages

Follow Conventional Commits v1.0.0 specification.

## Format

```
<type>(<scope>): <subject>
```

## Types

| Type       | Description                                      | Version Bump |
| ---------- | ------------------------------------------------ | ------------ |
| `feat`     | New features                                     | minor        |
| `fix`      | Bug fixes                                        | patch        |
| `refactor` | Code changes that don't fix bugs or add features | -            |
| `perf`     | Performance improvements                         | -            |
| `style`    | Formatting, whitespace (not CSS)                 | -            |
| `docs`     | Documentation only                               | -            |
| `test`     | Adding/updating tests                            | -            |
| `build`    | Build system or dependencies                     | -            |
| `chore`    | Maintenance tasks                                | -            |
| `ci`       | CI/CD changes                                    | -            |

## Scopes

- `app` — Mobile app changes
- `common` — Shared code/packages
- `config` — Configuration changes

## Rules

- Use imperative mood: "add" not "added" or "adds"
- Lowercase, no period at end
- Max 50 characters for subject line

## Examples

```
feat(app): add user profile screen
fix(app): resolve crash on empty recording
refactor(common): simplify auth flow
perf(app): optimize image loading
style(app): format recording screen
docs(config): update env variables
test(app): add recording service tests
build(common): upgrade expo sdk
chore(config): update gitignore
ci: add deployment workflow
```

## Breaking Changes

Add `!` after type/scope and include `BREAKING CHANGE:` in footer:

```
feat(app)!: redesign navigation structure

BREAKING CHANGE: Navigation routes have been renamed
```
