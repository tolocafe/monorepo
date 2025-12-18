# TOLO Coffee Shop App

React Native app for TOLO Coffee Shop built with Expo.

## Features

- **Menu**: Browse coffee, tea, pastries, and seasonal items
- **Store Info**: Location, hours, contact details
- **Localization**: English/Spanish support
- **Themes**: Light/dark mode
- **OTA Updates**: Over-the-air updates with fingerprint runtime policy

## Security

- **Rate Limiting**: Rate limiting is configured via Cloudflare Page Rules to prevent abuse of authentication and API endpoints
- **Authentication**: JWT-based authentication with secure HttpOnly cookies for web clients
- **OTP Security**: Single-use OTP codes with TTL expiration stored in KV

## Quick Start

```bash
# Install
bun install

# Run
bun run ios     # iOS
bun run android # Android
bun run web     # Web

# Translations
bun run lingui:extract  # Extract strings

# Updates
bun run update:publish              # Publish update to all channels
bun run update:publish:preview      # Publish to preview channel
bun run update:publish:production   # Publish to production channel
```

## Stack

- Expo Router for navigation
- React Native Unistyles for styling
- Lingui for internationalization
- Expo Updates with fingerprint runtime policy
- TypeScript

## Updates

OTA updates with fingerprint runtime policy. Updates are silent and errors are tracked in Sentry.

```bash
# Publish updates
bun run update:publish:production "Bug fixes"
bun run update:publish:preview "New features"
```

## Workers data sync (Cloudflare D1 + Drizzle)

> Migrating to Neon (Postgres) via Hyperdrive — D1 is no longer used for transaction sync. PassKit tables remain on D1.

- Scheduled worker incrementally pulls Poster transactions and hydrates customers, products, modifiers, ingredients, categories, and locations into Neon through the `HYPERDRIVE` binding using Drizzle (Postgres).
- Schema is managed via SQL migrations; apply `migrations/neon/0001_init.sql` to the Neon project/branch before running the worker.
- Cursor lives in `sync_state` (id: `transactions`) storing the last seen `transaction_id`; fetching stops once a known id is reached.
- Debug route: `GET /api/debug/db` returns transaction count and cursor from Neon.
- Tail scheduled runs: `wrangler tail tolo-app --event-type=scheduled`.
- Run ad-hoc SQL: `psql <neon-connection-string>` or via Neon console; Hyperdrive connection string is exposed to the worker as `env.HYPERDRIVE.connectionString`.
