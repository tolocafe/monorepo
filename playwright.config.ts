import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: 'tests/e2e',
	timeout: 90_000,
	expect: {
		timeout: 10_000,
	},
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
	],
	webServer: {
		command: 'bunx --bun expo start --web --port 5173 --non-interactive',
		port: 5173,
		timeout: 180_000,
		reuseExistingServer: true,
	},
})


