import { test, expect } from '@playwright/test';
import { waitForAppToLoad, testResponsiveBreakpoints, setupConsoleErrorTracking } from './helpers/test-helpers';

test.describe('TOLO Coffee App - Example Tests', () => {
	test('should demonstrate test helper usage', async ({ page }) => {
		// Track console errors
		const errors = setupConsoleErrorTracking(page);
		
		await page.goto('/');
		
		// Use helper to wait for app to load
		await waitForAppToLoad(page);
		
		// Test responsive behavior
		await testResponsiveBreakpoints(page, async () => {
			await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		});
		
		// Check for JavaScript errors
		expect(errors).toHaveLength(0);
	});

	test('should handle basic user interactions', async ({ page }) => {
		await page.goto('/');
		await waitForAppToLoad(page);
		
		// Look for any interactive elements (menu items, buttons, etc.)
		const interactiveElements = page.locator('button, a, [role="button"], [role="link"]');
		const count = await interactiveElements.count();
		
		if (count > 0) {
			// Test first interactive element
			const firstElement = interactiveElements.first();
			await expect(firstElement).toBeVisible();
			
			// Check if it's focusable
			await firstElement.focus();
			await expect(firstElement).toBeFocused();
		}
	});

	test('should maintain functionality across page reloads', async ({ page }) => {
		await page.goto('/');
		await waitForAppToLoad(page);
		
		// Record the initial state
		const initialUrl = page.url();
		const menuVisible = await page.getByRole('heading', { name: 'Menu' }).isVisible();
		
		// Reload the page
		await page.reload();
		await waitForAppToLoad(page);
		
		// Verify state is maintained
		expect(page.url()).toBe(initialUrl);
		
		if (menuVisible) {
			await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		}
	});
});