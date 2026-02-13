@_context_/whitepaper.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Root-level scripts (run from monorepo root):**

- `bun install` - Install all workspace dependencies (always use bun, never npm/yarn)
- `bun run lint` - Lint all workspaces
- `bun run typecheck` - TypeScript check all workspaces
- `bun run format` - Format all workspaces
- `bun run test` - Run tests in all workspaces

**Workspace-specific commands:**

- `bun run --filter @tolo/app <script>` - Run script in mobile app
- `bun run --filter @tolo/workers <script>` - Run script in workers
- `bun run --filter @tolo/studio <script>` - Run script in Sanity Studio
- `bun run --filter @tolo/website <script>` - Run script in marketing website

**For workspace-specific scripts**, check each workspace's `package.json`.

## Architecture Overview

### Monorepo Structure

This is a **bun workspaces monorepo** with multiple applications and shared packages:

```
tolo.cafe/
├── apps/
│   ├── app/          # React Native mobile app (Expo)
│   ├── workers/      # Cloudflare Workers API
│   ├── studio/       # Sanity Studio CMS
│   ├── website/      # Marketing website (React Router + Cloudflare)
│   └── poster-plugin/# Poster POS integration plugin
├── packages/
│   ├── common/       # Shared utilities and types
│   ├── oxlint-config/# Shared linting configuration
│   ├── oxfmt-config/ # Shared formatting configuration
│   └── typescript-config/ # Shared TypeScript configuration
└── package.json      # Root workspace configuration with catalog
```

### Applications

**Mobile App** (`apps/app/`):

- React Native with Expo (cross-platform iOS/Android/Web)
- File-based routing with Expo Router
- TypeScript with strict mode
- Source code in `apps/app/src/`

**Workers API** (`apps/workers/`):

- Cloudflare Workers with Hono framework
- Handles authentication, menu data, orders, transactions
- Uses D1 database, KV storage, and Stripe integration
- **Rate limiting**: Configured via Cloudflare dashboard rules (not in application code)

**Sanity Studio** (`apps/studio/`):

- Sanity CMS for content management
- Manages menu items, blog posts, events, promotions

**Marketing Website** (`apps/website/`):

- React Router v7 with Cloudflare Workers
- Vanilla Extract for styling
- Server-side rendering

**Poster Plugin** (`apps/poster-plugin/`):

- Integration plugin for Poster POS system
- Vite-based build

### Shared Packages

- `@tolo/common` - Shared utilities, types, and schemas
- `@tolo/oxlint-config` - oxlint configuration presets
- `@tolo/oxfmt-config` - oxfmt configuration presets
- `@tolo/typescript-config` - TypeScript configuration presets

### Key Technologies

- **Mobile**: React Native, Expo Router, React Native Unistyles, Lingui (i18n)
- **State Management**: TanStack Query (server state), React Context (client state), Zustand (complex state)
- **Backend**: Cloudflare Workers, Hono, D1 database, KV storage
- **CMS**: Sanity
- **Website**: React Router, Vanilla Extract
- **Styling**: React Native Unistyles (mobile), Vanilla Extract (website)
- **Testing**: Jest (mobile), Vitest (workers)
- **Linting**: oxlint with type-aware mode
- **Formatting**: oxfmt
- **Package Manager**: bun with workspaces and catalog

### Data Flow

- Mobile app fetches data from `/api/*` routes served by Workers
- Workers handle authentication via JWT tokens stored in KV
- Menu data cached in both KV and mobile app for offline support
- Real-time updates via OTA (Over-The-Air) using Expo Updates
- Content managed in Sanity, fetched by Workers and Website

### Project Structure (Mobile App)

- `apps/app/src/app/` - Expo Router pages (file-based routing)
- `apps/app/src/components/` - Reusable UI components
- `apps/app/src/lib/` - Utilities, hooks, queries, contexts
- `apps/app/src/lib/queries/` - TanStack Query definitions

### Project Structure (Workers API)

- `apps/workers/routes/` - API route handlers
- `apps/workers/utils/` - Utility functions
- `apps/workers/types.ts` - Type definitions

## Code Priorities

The codebase prioritizes these qualities in order:

1. **Simplicity**: Straightforward, easy to understand. Avoid over-engineering.
2. **Modernity**: Current best practices, modern APIs, up-to-date patterns.
3. **Legibility**: Self-documenting with clear naming and logical organization.
4. **Elegance**: Clean, efficient implementations that feel natural.

## Important Development Rules

### Code Standards

- **No React default import**: Use `import { useState } from 'react'` not `import React`
- **Absolute imports**: Use `@/` instead of relative paths for src/ imports (in apps)
- **All styling via Unistyles**: Never use inline styles in mobile app
- **Use existing design tokens**: Always use tokens from the theme (space, fontSize, fontWeight, radius, colors) instead of hardcoded values. Mobile: `apps/app/src/lib/styles/unistyles.ts`. Website: `apps/website/app/styles/tokens.css.ts`
- **Web layouts**: Prefer CSS Grid for complex layouts. Only use Flexbox for trivial one-dimensional structures
- **All text via Lingui**: No hardcoded user-facing strings in mobile app
- **Lingui .po files only**: Never compile translations, use .po files directly
- **TanStack Query patterns**: Use queryOptions/mutationOptions, avoid custom query hooks
- **TypeScript strict**: No `any` types, proper interfaces required
- **File naming**: kebab-case for utilities/hooks, PascalCase allowed for React component files/directories
- **Avoid classes**: Prefer simple objects and functions over classes
- **React Compiler**: Enabled for automatic memoization; less manual React.memo/useMemo/useCallback needed

### Import Patterns

- **Lingui**: `import { Trans } from '@lingui/react/macro'` and `import { t } from '@lingui/core/macro'`
- **React**: `import { useState, useEffect } from 'react'`
- **React Native**: `import { View, Text } from 'react-native'`
- **Never**: `import React from 'react'` or `import { t } from '@lingui/macro'`

### Internationalization (Mobile App)

- **Supported languages**: English (en, source), Spanish (es), French (fr), Portuguese (pt), Japanese (ja), German (de)
- **Extract translations**: `bun run --filter @tolo/app lingui:extract` (never use lingui:compile)
- **Provide context**: Add context for ambiguous terms (e.g., "menu" navigation vs food)

### TypeScript Patterns

- **Inferred return types**: Prefer type inference over explicit return type annotations
  - `function getUser(id: string) { return fetchUser(id) }`
- **Top-level type definitions**: Define types at module scope, not inline
- **Type narrowing**: Use type guards (`'asset' in obj`) for union type discrimination
- **Generic constraints**: Use `<T extends BaseType>` when generic types need specific properties

### Task Specs

For tasks that require complex context, assets (screenshots, mockups), or research findings, create a spec directory under `_specs_/` with a descriptive name and a markdown file documenting the context. Example: `_specs_/checkout-redesign/spec.md` with related screenshots alongside it.

### Required Workflow

After completing any task:

1. Run `bun run lint` and fix all errors
2. Run `bun run typecheck` and fix all errors
3. Run `bun run format` to format code
4. Run tests if applicable: `bun run test`

IMPORTANT: Do not create README files or documentation files. Code should be self-documenting through clear naming, proper structure, and minimal JSDoc where truly needed.

### Commit Messages

Follow Conventional Commits v1.0.0:

**Types:**

- `feat`: New features (minor version bump)
- `fix`: Bug fixes (patch version bump)
- `refactor`: Code changes that don't fix bugs or add features
- `perf`: Performance improvements
- `style`: Formatting, whitespace (not CSS)
- `docs`: Documentation only
- `test`: Adding/updating tests
- `build`: Build system or dependencies
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Scopes:** `app`, `workers`, `studio`, `website`, `common`, `ui`, `api`, `menu`, `navigation`, `i18n`, `auth`

**Rules:**

- Use imperative mood: "add" not "added" or "adds"
- Lowercase, no period at end
- Max 50 characters for subject line
- Example: `feat(app): add coffee item filtering`

## Brand Guidelines

### Image Atmosphere Prompt

When generating images for Tolo (blog posts, marketing, social media), append this atmosphere prompt to ensure brand consistency:

```
Warm and cozy mood with an inviting café feeling. Bright and airy lighting with clean shadows and high-key exposure. Soft pastel color palette with muted, gentle tones. Authentic documentary style capturing real, candid moments with an unposed feeling. People should appear Mexican/Latino/Hispanic. Urban settings should reflect small-city Mexican streets and neighborhoods. Home interiors should reflect Mexican middle-class aesthetic with warm, lived-in character. Coffee equipment (grinders, scales, roasters, brewing tools) should appear modern and contemporary.
```

**Key attributes:**
- **Mood**: Warm & cozy, inviting, comfortable, intimate
- **Lighting**: Bright & airy, well-lit, clean shadows, natural window light
- **Colors**: Soft pastels, muted tones, gentle understated colors
- **Style**: Authentic/documentary, real moments, candid, unposed
- **People**: Mexican/Latino/Hispanic appearance
- **Urban settings**: Small-city Mexican streets and neighborhoods
- **Home interiors**: Mexican middle-class aesthetic, warm and lived-in
- **Coffee equipment**: Modern, contemporary grinders, scales, roasters, and brewing tools

## Sanity Content Guidelines

### Blog Post Body Content Structure

When creating or updating blog post content in Sanity, use rich text formatting with proper semantic structure:

**Heading Hierarchy:**
- **Never use h1 in body content** - The page title is rendered as h1, so body content should start at h2
- Use **h2** for main section headings (e.g., "Coffee Regions", "Brewing Tips", "Equipment Needed")
- Use **h3** for sub-sections within h2 sections
- Each major topic or section should have its own h2 heading

**Text Formatting:**
- Use **bold** for key terms, important concepts, and emphasis (e.g., **washed process**, **92-96°C**, **Sidamo region**)
- Use *italic* for foreign words, titles, or subtle emphasis
- Use **blockquote** for quotes or callouts

**Lists:**
- Use **bullet lists** for unordered items (features, tips, equipment lists)
- Use **numbered lists** for sequential steps or ranked items

**Content Structure Pattern:**
```
[Introductory paragraph - no heading]

## First Section Heading
Paragraph with **bold key terms** and explanation.

## Second Section Heading
More content with proper formatting.

- Bullet point one
- Bullet point two

## Conclusion or Final Section
Closing thoughts.
```

**When using `patch_document_from_markdown`:**
- Write content in standard Markdown format
- Use `##` for h2 headings (never `#` for h1)
- Use `**text**` for bold
- Use `*text*` for italic
- Use `-` or `*` for bullet lists
- Use `1.` for numbered lists

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
