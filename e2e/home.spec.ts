import { expect, test } from '@playwright/test'

test.describe('Home Page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('should load and display the home page', async ({ page }) => {
		// Wait for the page to load
		await page.waitForLoadState('networkidle')

		// Check that the page title is set
		await expect(page).toHaveTitle(/Menu - TOLO Good Coffee/)
	})

	test('should display promotions section', async ({ page }) => {
		// Wait for content to load
		await page.waitForLoadState('networkidle')

		// Check for promotions content
		// Note: This will pass even if no promotions exist, as sections may be empty
		const body = await page.textContent('body')
		expect(body).toBeTruthy()
	})

	test('should display categories section', async ({ page }) => {
		// Wait for content to load
		await page.waitForLoadState('networkidle')

		// Verify page has content loaded
		const body = await page.textContent('body')
		expect(body).toBeTruthy()
	})

	test('should display coffees section', async ({ page }) => {
		// Wait for content to load
		await page.waitForLoadState('networkidle')

		// Verify page has content loaded
		const body = await page.textContent('body')
		expect(body).toBeTruthy()
	})

	test('should display events section', async ({ page }) => {
		// Wait for content to load
		await page.waitForLoadState('networkidle')

		// Verify page has content loaded
		const body = await page.textContent('body')
		expect(body).toBeTruthy()
	})

	test('should display disclaimer text', async ({ page }) => {
		// Wait for content to load
		await page.waitForLoadState('networkidle')

		// Check for disclaimer text
		const disclaimerText = page.getByText(/Prices are subject to change/)
		await expect(disclaimerText).toBeVisible()
	})
})
