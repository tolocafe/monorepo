# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Critical scripts:**

- `bun install` - Install dependencies (always use bun, never npm/yarn)
- `bun run start` - Start Expo development server
- `bun run lint` - Lint code (required before commits)
- `bun run typecheck` - TypeScript type checking (required before commits)
- `bun run format` - Format code (required before commits)
- `bun run test` - Run tests

**For all other commands** (ios, android, web, database, deployment, etc.), read `package.json` scripts section.

## Architecture Overview

### Hybrid Architecture

This is a **dual-platform codebase** with both React Native mobile app and Cloudflare Workers API:

**Mobile App** (`src/`):

- React Native with Expo (cross-platform iOS/Android/Web)
- File-based routing with Expo Router
- TypeScript throughout with strict mode

**Workers API** (`apps/workers/`):

- Cloudflare Workers with Hono framework
- Handles authentication, menu data, orders, transactions
- Uses D1 database, KV storage, and Stripe integration
- **Rate limiting**: Configured via Cloudflare dashboard rules (not in application code)

### Key Technologies

- **Frontend**: React Native, Expo Router, React Native Unistyles (styling), Lingui (i18n)
- **State Management**: TanStack Query (server state), React Context (client state), Zustand (complex state)
- **Backend**: Cloudflare Workers, Hono, D1 database, KV storage
- **Styling**: React Native Unistyles only (never inline styles)
- **Testing**: Jest with React Native Testing Library
- **Linting**: oxlint (not ESLint)
- **Formatting**: oxfmt (not Prettier)
- **Package Manager**: bun (never npm/yarn)

### Data Flow

- Mobile app fetches data from `/api/*` routes served by Workers
- Workers handle authentication via JWT tokens stored in KV
- Menu data cached in both KV and mobile app for offline support
- Real-time updates via OTA (Over-The-Air) using Expo Updates

### Project Structure

- `src/app/` - Expo Router pages (file-based routing)
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities, hooks, queries, contexts
- `src/lib/queries/` - TanStack Query definitions
- `apps/workers/` - Cloudflare Workers API
- `apps/workers/routes/` - API route handlers

## Important Development Rules

### Code Standards

- **No React default import**: Use `import { useState } from 'react'` not `import React`
- **Absolute imports**: Use `@/` instead of relative paths for src/ imports
- **All styling via Unistyles**: Never use inline styles, always createStyleSheet
- **All text via Lingui**: No hardcoded user-facing strings, use Trans/t macros
- **Lingui .po files only**: Never compile translations, use .po files directly
- **TanStack Query patterns**: Use queryOptions/mutationOptions, avoid custom query hooks
- **TypeScript strict**: No `any` types, proper interfaces required
- **File naming**: kebab-case files, PascalCase component exports

### Import Patterns

- **Lingui**: `import { Trans } from '@lingui/react/macro'` and `import { t } from '@lingui/core/macro'`
- **React**: `import { useState, useEffect } from 'react'`
- **React Native**: `import { View, Text } from 'react-native'`
- **Never**: `import React from 'react'` or `import { t } from '@lingui/macro'`

### TypeScript Patterns

- **Inferred return types**: Prefer type inference over explicit return type annotations
  - ✅ `function getUser(id: string) { return fetchUser(id) }`
  - ❌ `function getUser(id: string): Promise<User> { return fetchUser(id) }`
- **Top-level type definitions**: Define types at module scope, not inline
  - ✅ Define `type User = { ... }` at top, use in function signatures
  - ❌ Inline complex types in function signatures or return types
- **Type narrowing**: Use type guards (`'asset' in obj`) for union type discrimination
- **Generic constraints**: Use `<T extends BaseType>` when generic types need specific properties

### Required Workflow

After completing any task:

1. Run `bun run lint` and fix all errors
2. Run `bun run typecheck` and fix all errors
3. Run `bun run format` to format code
4. Run tests if applicable: `bun run test`

IMPORTANT: Do not create README files or documentation files. Code should be self-documenting through clear naming, proper structure, and minimal JSDoc where truly needed.

### Commit Messages

Follow Conventional Commits v1.0.0:

- `feat(scope): description` for new features
- `fix(scope): description` for bug fixes
- `refactor(scope): description` for code improvements
- Use scopes like: `ui`, `api`, `menu`, `navigation`, `i18n`

## Security Notes

### Rate Limiting

- **Application-level rate limiting**: NOT implemented in code
- **Infrastructure-level rate limiting**: Configured via Cloudflare dashboard WAF rules
- When reviewing or modifying authentication endpoints (`/api/auth/*`), remember that rate limiting is handled at the Cloudflare edge, not in the application layer

### Authentication

- JWT tokens with 1-year expiration stored in HttpOnly cookies (web) or client storage (mobile)
- OTP-based authentication for phone number verification
- Session management via KV storage
- **Never** accept authentication tokens from URL query parameters in production

### Database Security

- Use parameterized queries (`.bind()`) for all D1 database operations
- Avoid dynamic query string construction
- CREATE TABLE statements exist inline - schema migrations not yet implemented
