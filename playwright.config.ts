import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for desktop and mobile web testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	forbidOnly: Boolean(process.env.CI),
	fullyParallel: true,
	projects: [
		{
			name: 'Desktop Chrome',
			use: { ...devices['Desktop Chrome'] },
		},

		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},

		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],
	reporter: 'html',
	retries: process.env.CI ? 2 : 0,
	testDir: './e2e',
	use: {
		baseURL: 'http://localhost:8081',
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'bun run web',
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
		url: 'http://localhost:8081',
	},
	workers: process.env.CI ? 1 : undefined,
})
