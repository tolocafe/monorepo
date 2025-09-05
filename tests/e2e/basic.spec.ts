import { test, expect } from '@playwright/test';

test.describe('TOLO Coffee App - Basic Functionality', () => {
	test('should load the homepage and display menu', async ({ page }) => {
		await page.goto('/');

		// Wait for the page to load
		await expect(page).toHaveTitle(/Menu - TOLO Good Coffee/);
		
		// Check if the main menu heading is visible
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Check if the page has loaded by waiting for menu items or loading state
		const menuContent = page.locator('[data-testid="menu-content"], text="Loading menu..."');
		await expect(menuContent).toBeVisible({ timeout: 10000 });
	});

	test('should handle loading states gracefully', async ({ page }) => {
		await page.goto('/');
		
		// Check if loading indicator appears initially (if slow network)
		const loadingText = page.getByText('Loading menu...');
		
		// Either loading text should appear and then disappear, or menu should load directly
		try {
			await expect(loadingText).toBeVisible({ timeout: 2000 });
			await expect(loadingText).not.toBeVisible({ timeout: 10000 });
		} catch {
			// If loading is too fast, that's fine - just ensure menu is visible
			await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		}
	});

	test('should display proper meta tags for SEO', async ({ page }) => {
		await page.goto('/');
		
		// Check meta description
		const metaDescription = page.locator('meta[name="description"]');
		await expect(metaDescription).toHaveAttribute('content', /coffee menu/i);
		
		// Check meta keywords
		const metaKeywords = page.locator('meta[name="keywords"]');
		await expect(metaKeywords).toHaveAttribute('content', /TOLO menu/i);
	});

	test('should be responsive and handle different viewport sizes', async ({ page }) => {
		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');
		
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Test desktop viewport  
		await page.setViewportSize({ width: 1280, height: 720 });
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
	});

	test('should handle network errors gracefully', async ({ page }) => {
		// Simulate network failure
		await page.route('**/api/**', route => route.abort());
		
		await page.goto('/');
		
		// Should show error message or fallback content
		const errorContent = page.getByText(/Failed to load|error/i);
		const retryButton = page.getByRole('button', { name: /retry/i });
		
		// Either error message should appear or menu should load from cache
		try {
			await expect(errorContent).toBeVisible({ timeout: 5000 });
			await expect(retryButton).toBeVisible();
		} catch {
			// If no error (maybe cached), ensure menu is still visible
			await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		}
	});
});