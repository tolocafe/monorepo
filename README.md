# TOLO Coffee Shop App

React Native app for TOLO Coffee Shop built with Expo.

## Features

- **Menu**: Browse coffee, tea, pastries, and seasonal items
- **Store Info**: Location, hours, contact details
- **Localization**: English/Spanish support
- **Themes**: Light/dark mode
- **OTA Updates**: Over-the-air updates with fingerprint runtime policy

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
