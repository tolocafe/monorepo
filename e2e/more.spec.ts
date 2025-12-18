import { expect, test } from '@playwright/test'

test.describe('More Tab', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
		// Wait for initial page load
		await page.waitForLoadState('networkidle')
	})

	test('should display app version in footer', async ({ page }) => {
		// Navigate to More tab
		// Look for the More tab navigation button
		const moreTab = page.getByRole('link', { name: /more/i })
		await moreTab.click()

		// Wait for navigation
		await page.waitForLoadState('networkidle')

		// Check for version text in footer
		// The version format is "Version X.X.X (build)"
		const versionText = page.getByText(/Version.*\(.*\)/)
		await expect(versionText).toBeVisible()
	})

	test('should show sign-in button when not authenticated', async ({
		page,
	}) => {
		// Navigate to More tab
		const moreTab = page.getByRole('link', { name: /more/i })
		await moreTab.click()

		// Wait for navigation
		await page.waitForLoadState('networkidle')

		// Check for Sign In button
		const signInButton = page.getByRole('button', { name: /sign in/i })
		await expect(signInButton).toBeVisible()
	})

	test('should navigate to sign-in page when clicking Sign In button', async ({
		page,
	}) => {
		// Navigate to More tab
		const moreTab = page.getByRole('link', { name: /more/i })
		await moreTab.click()

		// Wait for navigation
		await page.waitForLoadState('networkidle')

		// Click Sign In button
		const signInButton = page.getByRole('button', { name: /sign in/i })
		await signInButton.click()

		// Wait for sign-in page to load
		await page.waitForLoadState('networkidle')

		// Verify we're on the sign-in page
		// Check for welcome heading or phone number input
		const welcomeHeading = page.getByRole('heading', { name: /welcome/i })
		await expect(welcomeHeading).toBeVisible()

		// Alternative check: look for phone number input
		const phoneInput = page.getByPlaceholder(/phone/i)
		await expect(phoneInput).toBeVisible()
	})
})
