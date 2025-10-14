import { Platform } from 'react-native'

import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'

import { api } from '@/lib/services/api-service'

/**
 * Downloads a receipt PDF for the given order ID
 * @param orderId - The order ID to download receipt for
 */
export async function downloadReceipt(orderId: string): Promise<void> {
	try {
		// Fetch the PDF blob from the API
		const pdfBlob = await api.orders.downloadReceipt(orderId)

		if (Platform.OS === 'web') {
			// For web, create a download link
			const url = URL.createObjectURL(pdfBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `recibo-${orderId}.pdf`
			document.body.append(link as unknown as string)
			link.click()
			link.remove()
			URL.revokeObjectURL(url)
		} else {
			// For native, save to file system and share
			const fileName = `recibo-${orderId}.pdf`
			const file = new File(Paths.document, fileName)

			// Convert blob to base64 and write to file
			const base64 = await blobToBase64(pdfBlob)
			file.write(base64, { encoding: 'base64' })

			// Share the file
			if (await Sharing.isAvailableAsync()) {
				await Sharing.shareAsync(file.uri, {
					dialogTitle: 'Download Receipt',
					mimeType: 'application/pdf',
				})
			}
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error downloading receipt:', error)

		if (error instanceof Error) {
			throw new Error(`Failed to download receipt: ${error.message}`)
		}
		throw new Error('Failed to download receipt')
	}
}

/**
 * Converts a blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.addEventListener('load', () => {
			const result = reader.result as string
			// Remove data URL prefix
			const base64 = result.split(',')[1]
			resolve(base64)
		})
		// eslint-disable-next-line unicorn/prefer-add-event-listener
		reader.onerror = reject
		reader.readAsDataURL(blob)
	})
}
