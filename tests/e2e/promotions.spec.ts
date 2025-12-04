import { test, expect } from '@playwright/test'

test.describe('Promotions', () => {
	test('renders promotion banners and navigates to product', async ({ page }) => {
		// Stub API endpoints used by the home screen
		await page.route('**/api/promotions', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						id: '123',
						image: '/images/promo-1.jpg',
						productId: '123',
						title: 'Promo Product 1',
						subtitle: 'Limited time only',
					},
					{
						id: '456',
						image: '/images/promo-2.jpg',
						productId: '456',
						title: 'Promo Product 2',
						subtitle: 'New',
					},
				]),
			})
		})

		await page.route('**/api/menu/products', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([]),
			})
		})

		await page.route('**/api/menu/categories', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([]),
			})
		})

		await page.route('**/api/coffees', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([]),
			})
		})

		// Stub product details for navigation
		await page.route('**/api/menu/products/123', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					product_id: '123',
					product_name: 'Promo Product 1',
					price: { '1': '300' }, // $3.00
					spots: [{ spot_id: '1', price: '300', profit: '0', profit_netto: '0', visible: '1' }],
					group_modifications: [],
					hidden: '0',
					menu_category_id: '99',
					category_name: 'Promo',
					barcode: '',
					color: '',
					cooking_time: '',
					cost: '',
					cost_netto: '',
					different_spots_prices: '',
					fiscal: '',
					ingredient_id: '',
					master_id: '',
					nodiscount: '',
					out: 0,
					photo: '',
					photo_origin: '',
					product_code: '',
					product_production_description: '',
					product_tax_id: '',
					profit: {},
					sort_order: '0',
					sources: [],
					tax_id: '',
					type: '',
					unit: '',
					weight_flag: '',
					workshop: '',
				}),
			})
		})

		await page.goto('/')

		// Ensure a banner appears
		const banner = page.getByTestId('promotion-banner-0')
		await expect(banner).toBeVisible()

		// Navigate via banner
		await banner.click()

		// Product page shows product name
		await expect(page.getByText('Promo Product 1', { exact: true })).toBeVisible()
	})
})


