# E2E Tests

End-to-end tests using Playwright for desktop and mobile web.

## Prerequisites

Install dependencies:

```bash
bun install
```

Playwright is installed on-demand via bunx when running tests. To pre-install browsers:

```bash
bunx playwright install chromium
```

## Running Tests

The web server must be running before tests can execute. The Playwright config automatically starts it.

### Run all tests

```bash
bun run test:e2e
```

### Run tests in headed mode (see the browser)

```bash
bun run test:e2e:headed
```

### Run tests in UI mode (interactive)

```bash
bun run test:e2e:ui
```

### View test report

```bash
bun run test:e2e:report
```

## Test Structure

- `e2e/home.spec.ts` - Tests for the home/menu page
- `e2e/more.spec.ts` - Tests for the More tab including version display and sign-in navigation

## Test Environments

Tests run on multiple configurations:

- Desktop Chrome
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Writing Tests

Follow the existing test patterns:

```typescript
import { expect, test } from '@playwright/test'

test.describe('Feature Name', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
	})

	test('should do something', async ({ page }) => {
		// Your test code
		const element = page.getByRole('button', { name: /click me/i })
		await expect(element).toBeVisible()
	})
})
```

## Notes

- Playwright is installed on-demand via bunx (not in package.json due to bun compatibility issues)
- The web server runs on `http://localhost:8081` by default
- Tests use `networkidle` to wait for page loads to ensure data is loaded
