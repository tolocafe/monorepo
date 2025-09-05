import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Helper functions for Playwright tests
 */

/**
 * Wait for the app to finish loading
 */
export async function waitForAppToLoad(page: Page) {
	// Wait for either the menu to load or loading indicator to appear
	const menuHeading = page.getByRole('heading', { name: 'Menu' });
	const loadingText = page.getByText('Loading menu...');
	
	try {
		// First check if loading appears
		await expect(loadingText).toBeVisible({ timeout: 2000 });
		// Then wait for it to disappear
		await expect(loadingText).not.toBeVisible({ timeout: 10000 });
		// Finally ensure menu is visible
		await expect(menuHeading).toBeVisible();
	} catch {
		// If no loading state, just ensure menu is visible
		await expect(menuHeading).toBeVisible({ timeout: 10000 });
	}
}

/**
 * Check if an element is accessible via keyboard
 */
export async function checkKeyboardAccessibility(element: Locator) {
	await element.focus();
	await expect(element).toBeFocused();
	
	// Test Enter key
	await element.press('Enter');
	
	// Test Space key for buttons
	const tagName = await element.evaluate(el => el.tagName.toLowerCase());
	if (tagName === 'button') {
		await element.press(' ');
	}
}

/**
 * Check basic accessibility requirements for an element
 */
export async function checkElementAccessibility(element: Locator) {
	// Should be visible
	await expect(element).toBeVisible();
	
	// Should have proper role or tag
	const tagName = await element.evaluate(el => el.tagName.toLowerCase());
	const role = await element.getAttribute('role');
	
	// Interactive elements should have proper roles
	const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
	const interactiveRoles = ['button', 'link', 'textbox', 'combobox', 'listbox'];
	
	if (interactiveTags.includes(tagName) || (role && interactiveRoles.includes(role))) {
		// Should be focusable
		await element.focus();
		await expect(element).toBeFocused();
	}
}

/**
 * Test responsive behavior at different breakpoints
 */
export async function testResponsiveBreakpoints(page: Page, testFn: () => Promise<void>) {
	const breakpoints = [
		{ name: 'Mobile', width: 375, height: 667 },
		{ name: 'Tablet', width: 768, height: 1024 },
		{ name: 'Desktop', width: 1280, height: 720 },
		{ name: 'Large Desktop', width: 1920, height: 1080 },
	];
	
	for (const breakpoint of breakpoints) {
		await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
		await testFn();
	}
}

/**
 * Simulate slow network conditions
 */
export async function simulateSlowNetwork(page: Page) {
	await page.route('**/*', async route => {
		// Add delay to simulate slow network
		await new Promise(resolve => setTimeout(resolve, 1000));
		await route.continue();
	});
}

/**
 * Check for console errors
 */
export function setupConsoleErrorTracking(page: Page): string[] {
	const errors: string[] = [];
	
	page.on('console', msg => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
		}
	});
	
	page.on('pageerror', error => {
		errors.push(error.message);
	});
	
	return errors;
}