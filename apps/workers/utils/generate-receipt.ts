import puppeteer from '@cloudflare/puppeteer'
import type { BrowserWorker } from '@cloudflare/puppeteer'
import * as Sentry from '@sentry/cloudflare'

type ReceiptData = {
	clientName?: string
	date: string
	discount?: number
	orderId: string
	products: {
		modifications?: string[]
		name: string
		price: number
		quantity: number
		total: number
	}[]
	subtotal: number
	tax?: number
	tip?: number
	title: string
	total: number
}

const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString('es-MX', {
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		month: 'long',
		year: 'numeric',
	})

const generateReceiptHTML = (data: ReceiptData) => `
<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>${data.title}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background-color: #ffffff;
			color: #000000;
			line-height: 1.6;
			padding: 40px;
		}

		.container {
			max-width: 600px;
			margin: 0 auto;
		}

		.header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 40px;
			padding-bottom: 20px;
			border-bottom: 2px solid #3D6039;
		}

		.header-content {
			text-align: left;
			flex: 1;
		}

		.title {
			font-size: 32px;
			font-weight: bold;
			color: #000000;
			margin-bottom: 10px;
		}

		.subtitle {
			font-size: 16px;
			color: #000000;
		}

		.icon {
			width: 60px;
			height: 60px;
			border-radius: 12px;
			margin-left: 20px;
		}

		.order-info {
			background-color: #F8F9FA;
			border: 1px solid #E9ECEF;
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 30px;
		}

		.order-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 0;
			border-bottom: 1px solid #E9ECEF;
		}

		.order-row:last-child {
			border-bottom: none;
		}

		.order-label {
			font-weight: 600;
			color: #000000;
		}

		.order-value {
			color: #000000;
		}

		.products-section {
			margin-bottom: 30px;
		}

		.products-title {
			font-size: 18px;
			font-weight: bold;
			color: #000000;
			margin-bottom: 15px;
			text-align: center;
		}

		.product-item {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			padding: 12px 0;
			border-bottom: 1px solid #E9ECEF;
		}

		.product-item:last-child {
			border-bottom: none;
		}

		.product-details {
			flex: 1;
		}

		.product-name {
			font-weight: 600;
			color: #000000;
			margin-bottom: 4px;
		}

		.product-modifications {
			font-size: 12px;
			color: #000000;
			margin-left: 10px;
		}

		.product-quantity {
			font-size: 12px;
			color: #000000;
		}

		.product-price {
			font-weight: 600;
			color: #000000;
			text-align: right;
		}

		.totals-section {
			background-color: #F8F9FA;
			border: 1px solid #E9ECEF;
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 30px;
		}

		.total-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 0;
		}

		.total-label {
			font-weight: 600;
			color: #000000;
		}

		.total-value {
			color: #000000;
		}

		.grand-total {
			border-top: 2px solid #3D6039;
			margin-top: 10px;
			padding-top: 10px;
		}

		.grand-total .total-label {
			font-size: 18px;
			color: #000000;
		}

		.grand-total .total-value {
			font-size: 18px;
			font-weight: bold;
			color: #000000;
		}

		.footer {
			text-align: center;
			margin-top: 40px;
			padding-top: 20px;
			border-top: 1px solid #E9ECEF;
			font-size: 12px;
			color: #000000;
		}

		.footer p {
			margin-bottom: 5px;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="header-content">
				<h1 class="title">${data.title}</h1>
				<p class="subtitle">TOLO - Buen Café</p>
			</div>
			<img src="https://app.tolo.cafe/icon.png" alt="TOLO" class="icon" />
		</div>

		<div class="order-info">
			<div class="order-row">
				<span class="order-label">Número de Orden:</span>
				<span class="order-value">${data.orderId}</span>
			</div>
			<div class="order-row">
				<span class="order-label">Fecha:</span>
				<span class="order-value">${formatDate(data.date)}</span>
			</div>
			${
				data.clientName
					? `
			<div class="order-row">
				<span class="order-label">Cliente:</span>
				<span class="order-value">${data.clientName}</span>
			</div>
			`
					: ''
			}
		</div>

		<div class="products-section">
			<h2 class="products-title">Productos</h2>
			${data.products
				.map(
					(product) => `
				<div class="product-item">
					<div class="product-details">
						<div class="product-name">${product.name}</div>
						${
							product.modifications && product.modifications.length > 0
								? `
							<div class="product-modifications">
								${product.modifications.join(', ')}
							</div>
						`
								: ''
						}
						<div class="product-quantity">Cantidad: ${product.quantity}</div>
					</div>
					<div class="product-price">${formatCurrency(product.total)}</div>
				</div>
			`,
				)
				.join('')}
		</div>

		<div class="totals-section">
			<div class="total-row">
				<span class="total-label">Subtotal:</span>
				<span class="total-value">${formatCurrency(data.subtotal)}</span>
			</div>
			${
				data.discount && data.discount > 0
					? `
			<div class="total-row">
				<span class="total-label">Descuento:</span>
				<span class="total-value" style="color: #28a745;">-${formatCurrency(data.discount)}</span>
			</div>
			`
					: ''
			}
			${
				data.tip && data.tip > 0
					? `
			<div class="total-row">
				<span class="total-label">Propina:</span>
				<span class="total-value">${formatCurrency(data.tip)}</span>
			</div>
			`
					: ''
			}
			${
				data.tax && data.tax > 0
					? `
			<div class="total-row">
				<span class="total-label">IVA:</span>
				<span class="total-value">${formatCurrency(data.tax)}</span>
			</div>
			`
					: ''
			}
			<div class="total-row grand-total">
				<span class="total-label">Total:</span>
				<span class="total-value">${formatCurrency(data.total)}</span>
			</div>
		</div>

		<div class="footer">
			<p>¡Gracias por elegir TOLO - Buen Café!</p>
			<p>Visítanos en: Blvd. José María Pino Suárez 800, Col. Cuauhtémoc</p>
			<p>Toluca de Lerdo, Estado de México</p>
		</div>
	</div>
</body>
</html>
`

export async function generateReceiptPDF(
	data: ReceiptData,
	browser: BrowserWorker,
): Promise<Buffer> {
	try {
		// Launch browser
		const browserInstance = await puppeteer.launch(browser)
		const page = await browserInstance.newPage()

		// Generate HTML content
		const htmlContent = generateReceiptHTML(data)

		// Set page content
		await page.setContent(htmlContent)

		// Generate PDF
		const pdf = await page.pdf({
			format: 'A4',
			margin: {
				bottom: '20px',
				left: '20px',
				right: '20px',
				top: '20px',
			},
			printBackground: true,
		})

		// Close browser
		await browserInstance.close()

		return Buffer.from(pdf)
	} catch (error) {
		// eslint-disable-next-line no-console
		Sentry.captureException(error, {
			extra: {
				context: 'Receipt PDF generation',
			},
		})
		throw new Error('Failed to generate PDF', { cause: error })
	}
}
