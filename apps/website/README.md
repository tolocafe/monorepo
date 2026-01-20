# TOLO - Buen Café

Website for TOLO, a specialty coffee shop in Toluca, Mexico.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [React Router 7](https://reactrouter.com/) with SSR
- **Hosting**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Styling**: [vanilla-extract](https://vanilla-extract.style/) (type-safe CSS)
- **CMS**: [Sanity](https://www.sanity.io/) (headless CMS)
- **Analytics**: [PostHog](https://posthog.com/) (product analytics)
- **Language**: TypeScript (strict mode)

## Features

- 🌐 **Bilingual** - Full Spanish (default) and English support
- ☕ **Beans Catalog** - Showcase coffee beans with origin, varietal, altitude, and tasting notes
- 🥤 **Products Menu** - Display drinks with intensity, caffeine levels, and recipes
- 📝 **Blog** - Localized blog posts with rich content
- 📄 **Dynamic Pages** - CMS-managed pages (about, contact, legal, etc.)
- 🚀 **Edge Rendering** - Server-side rendering on Cloudflare Workers

## Prerequisites

Install [Bun](https://bun.sh/) as the package manager:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Getting Started

### Install Dependencies

```bash
bun install
```

### Environment Variables

Create a `.env.local` file in the root directory with your PostHog configuration:

```bash
VITE_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key_here
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Get your PostHog API key from: https://app.posthog.com/project/settings

**Note**: These variables must be prefixed with `VITE_PUBLIC_` to be accessible in the frontend.

### Development

Start the development server:

```bash
bun run dev
```

The website will be available at `http://localhost:5173`.

### Sanity Studio

The Sanity Studio is located in the `/studio` directory:

```bash
cd studio
bun install
bun run dev
```

The studio will be available at `http://localhost:3333`.

## Project Structure

```
├── app/
│   ├── components/        # Reusable UI components
│   │   ├── Header/
│   │   └── Footer/
│   ├── lib/
│   │   ├── locale.ts      # Locale utilities
│   │   └── sanity.ts      # Sanity client and helpers
│   ├── routes/            # Route components
│   │   ├── home.tsx
│   │   ├── beans.tsx      # Beans list (/en/beans, /es/granos)
│   │   ├── bean.tsx       # Bean detail
│   │   ├── blog.tsx       # Blog list
│   │   ├── blog-post.tsx  # Blog post detail
│   │   ├── contact.tsx
│   │   └── page.tsx       # Dynamic CMS pages
│   ├── styles/            # Design tokens and global styles
│   └── routes.ts          # Route configuration
├── studio/                # Sanity Studio
│   └── schemaTypes/       # Content schemas
│       ├── beanType.ts    # Coffee beans
│       ├── productType.ts # Menu products/drinks
│       ├── postType.ts    # Blog posts
│       └── pageType.ts    # CMS pages
└── workers/               # Cloudflare Worker entry
```

## Localization

The site supports two locales:

- **Spanish (`es`)** - Default, primary language
- **English (`en`)** - Secondary language

### URL Structure

Routes are prefixed with the locale:

- `/es/` - Spanish pages
- `/en/` - English pages

Some routes have localized paths:

- `/es/granos` → `/en/beans` (Coffee beans)

### Content Localization

Sanity uses field-level localization with custom types:

- `localeString` - Localized short text
- `localeText` - Localized multiline text
- `localeBlockContent` - Localized rich text (Portable Text)
- `localeSlug` - Localized URL slugs

## Sanity Schemas

| Schema    | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| `bean`    | Coffee beans with origin, varietal, altitude, process, tasting notes |
| `product` | Menu items with intensity, caffeine, volume, calories, recipe        |
| `post`    | Blog posts with title, excerpt, body, featured image                 |
| `page`    | Dynamic pages (about, contact, legal, etc.)                          |

### Deploy Schema Changes

After modifying schemas in `/studio/schemaTypes/`:

```bash
cd studio && bunx sanity schema deploy
```

## Scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `bun run dev`       | Start development server          |
| `bun run build`     | Production build                  |
| `bun run preview`   | Preview production build          |
| `bun run deploy`    | Deploy to Cloudflare Workers      |
| `bun run typecheck` | Run TypeScript type checking      |
| `bun run typegen`   | Generate Cloudflare binding types |

## Deployment

Build and deploy to Cloudflare Workers:

```bash
bun run build
bun run deploy
```

### Environment Variables in Production

Set your PostHog environment variables in your hosting provider:

**Cloudflare Workers (via Wrangler)**:

```bash
wrangler secret put VITE_PUBLIC_POSTHOG_KEY
wrangler secret put VITE_PUBLIC_POSTHOG_HOST
```

Or add them to your `wrangler.json` or Cloudflare Dashboard under your Worker's settings.

## Styling

Uses [vanilla-extract](https://vanilla-extract.style/) with design tokens defined in `app/styles/tokens.css.ts`.

### Creating Component Styles

Create `.css.ts` files colocated with components:

```typescript
import { style } from '@vanilla-extract/css'
import { vars } from '~/styles'

export const card = style({
	backgroundColor: vars.color.background,
	padding: vars.space[6],
	borderRadius: vars.radius.xl,
	border: `1px solid ${vars.color.border}`,
})
```

## Analytics

PostHog is integrated for product analytics and event tracking.

### Automatic Page Tracking

To track page views in a route component:

```typescript
import { usePageTracking } from '~/lib/posthog'

export default function MyRoute() {
  usePageTracking()

  return <div>My Page</div>
}
```

### Custom Event Tracking

To track custom events:

```typescript
import { usePostHog } from '@posthog/react'

export default function MyComponent() {
  const posthog = usePostHog()

  const handleClick = () => {
    posthog?.capture('button_clicked', {
      button_name: 'cta_button',
      location: 'hero_section',
    })
  }

  return <button onClick={handleClick}>Click me</button>
}
```

### Feature Flags

Check feature flags:

```typescript
import { useFeatureFlagEnabled } from 'posthog-js/react'

export default function MyComponent() {
  const showNewFeature = useFeatureFlagEnabled('new_feature')

  return showNewFeature ? <NewFeature /> : <OldFeature />
}
```

---

Built with ☕ by TOLO
