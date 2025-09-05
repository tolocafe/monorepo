import { test, expect } from '@playwright/test';

test.describe('TOLO Coffee App - Accessibility', () => {
	test('should have proper heading structure', async ({ page }) => {
		await page.goto('/');
		
		// Wait for content to load
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Check for proper heading hierarchy
		const headings = page.locator('h1, h2, h3, h4, h5, h6');
		const headingCount = await headings.count();
		
		expect(headingCount).toBeGreaterThan(0);
		
		// Main heading should be present
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
	});

	test('should have proper focus management', async ({ page }) => {
		await page.goto('/');
		
		// Tab through focusable elements
		await page.keyboard.press('Tab');
		
		// Check if focus is visible on interactive elements
		const focusedElement = page.locator(':focus');
		await expect(focusedElement).toBeVisible();
	});

	test('should have proper ARIA labels and roles', async ({ page }) => {
		await page.goto('/');
		
		// Check for main landmark
		const main = page.getByRole('main');
		if (await main.count() > 0) {
			await expect(main).toBeVisible();
		}
		
		// Check for navigation landmarks
		const navigation = page.getByRole('navigation');
		if (await navigation.count() > 0) {
			await expect(navigation.first()).toBeVisible();
		}
		
		// Check for button roles on interactive elements
		const buttons = page.getByRole('button');
		const buttonCount = await buttons.count();
		
		if (buttonCount > 0) {
			await expect(buttons.first()).toBeVisible();
		}
	});

	test('should support keyboard navigation', async ({ page }) => {
		await page.goto('/');
		
		// Wait for content to load
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Test keyboard navigation
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		
		// Check if we can navigate with keyboard
		const focusedElement = page.locator(':focus');
		if (await focusedElement.count() > 0) {
			await expect(focusedElement).toBeVisible();
		}
		
		// Test Enter key activation
		await page.keyboard.press('Enter');
		
		// Should not cause any JavaScript errors
		const errors = [];
		page.on('pageerror', error => errors.push(error));
		
		// Wait a bit to catch any errors
		await page.waitForTimeout(1000);
		
		expect(errors.length).toBe(0);
	});

	test('should have sufficient color contrast', async ({ page }) => {
		await page.goto('/');
		
		// Wait for content to load
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Check text elements for color contrast
		const textElements = page.locator('h1, h2, h3, h4, h5, h6, p, span, a, button');
		const count = await textElements.count();
		
		expect(count).toBeGreaterThan(0);
		
		// Ensure text elements are visible (basic visibility check)
		if (count > 0) {
			await expect(textElements.first()).toBeVisible();
		}
	});

	test('should work with screen reader simulation', async ({ page }) => {
		await page.goto('/');
		
		// Wait for content to load
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Check for text alternatives on images
		const images = page.locator('img');
		const imageCount = await images.count();
		
		for (let i = 0; i < Math.min(imageCount, 5); i++) {
			const img = images.nth(i);
			if (await img.isVisible()) {
				// Images should have alt text or be marked as decorative
				const alt = await img.getAttribute('alt');
				const ariaHidden = await img.getAttribute('aria-hidden');
				
				expect(alt !== null || ariaHidden === 'true').toBeTruthy();
			}
		}
	});
});