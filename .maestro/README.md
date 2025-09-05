# E2E Testing with Maestro

This directory contains End-to-End (E2E) tests for the TOLO coffee shop app using [Maestro](https://maestro.mobile.dev/).

## Test Files

- `app-launch.yml` - Basic app launch test that verifies the app starts and main elements are visible
- `navigation-flow.yml` - Tests navigation between main tabs (Home, Orders, More)

## Local Testing

### Prerequisites

1. Install Maestro CLI:

   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. Start an Android emulator or iOS simulator

3. Install the app on your device/simulator:
   ```bash
   # For development builds
   bun run android
   # or
   bun run ios
   ```

### Running Tests

Run all tests:

```bash
bun run e2e:test
```

Run a specific test:

```bash
maestro test .maestro/app-launch.yml
```

## EAS Workflows

The project includes automated E2E testing workflows that run on EAS:

- `.eas/workflows/e2e-test-android.yml` - Android E2E testing workflow
- `.eas/workflows/e2e-test-ios.yml` - iOS E2E testing workflow

### Running E2E Tests on EAS

Build and test Android:

```bash
bun run e2e:test:android
```

Build and test iOS:

```bash
bun run e2e:test:ios
```

Build only (without running tests):

```bash
bun run e2e:build:android
bun run e2e:build:ios
```

### Workflow Triggers

The E2E workflows automatically run on:

- Pull requests to any branch
- Manual trigger via `workflow_dispatch`

## Build Profile

The `e2e-test` build profile in `eas.json` is configured to:

- Build without credentials (for testing only)
- Create APK for Android (suitable for emulators)
- Create simulator build for iOS
- Use the same Node.js and bun versions as other profiles

## Adding New Tests

1. Create new `.yml` files in the `.maestro/` directory
2. Add the new test file path to the workflow files in `.eas/workflows/`
3. Test locally first before pushing to ensure tests work correctly

## Test Structure

Maestro tests use YAML format with the following structure:

```yaml
appId: cafe.tolo.app # App bundle identifier
---
- launchApp # Launch the application
- assertVisible: 'Text' # Assert text is visible
- tapOn: 'Button' # Tap on element
- scrollUntilVisible: # Scroll to find element
    element: 'Text'
    direction: DOWN
```

For more advanced testing patterns, refer to the [Maestro documentation](https://maestro.mobile.dev/api-reference).
