import { test, expect } from '@playwright/test';

test.describe('TOLO Coffee App - Navigation', () => {
	test('should navigate between tabs', async ({ page }) => {
		await page.goto('/');
		
		// Wait for the page to load
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Check if tab navigation is present (for web, tabs might be visible)
		const homeTab = page.getByRole('link', { name: /home/i }).first();
		const ordersTab = page.getByRole('link', { name: /orders/i }).first();
		const moreTab = page.getByRole('link', { name: /more/i }).first();
		
		// Test navigation to different tabs if they exist
		if (await ordersTab.isVisible()) {
			await ordersTab.click();
			await expect(page).toHaveURL(/orders/);
		}
		
		if (await moreTab.isVisible()) {
			await moreTab.click();
			await expect(page).toHaveURL(/more/);
		}
		
		// Navigate back to home
		if (await homeTab.isVisible()) {
			await homeTab.click();
			await expect(page).toHaveURL(/^(?!.*\/(orders|more))/);
		}
	});

	test('should handle direct navigation to different routes', async ({ page }) => {
		// Test direct navigation to orders
		await page.goto('/orders');
		await expect(page).toHaveURL(/orders/);
		
		// Test direct navigation to more
		await page.goto('/more');
		await expect(page).toHaveURL(/more/);
		
		// Test navigation back to home
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
	});

	test('should handle 404 pages gracefully', async ({ page }) => {
		await page.goto('/non-existent-page');
		
		// Should either redirect to home or show 404 page
		try {
			await expect(page.getByText(/not found|404/i)).toBeVisible({ timeout: 5000 });
		} catch {
			// If redirected to home, that's also acceptable
			await expect(page).toHaveURL('/');
			await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		}
	});

	test('should maintain navigation state on page refresh', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
		
		// Refresh the page
		await page.reload();
		
		// Should still be on the same page
		await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
	});
});