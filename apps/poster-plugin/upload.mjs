/* eslint-disable no-console */
import fs from 'node:fs/promises'

import md5 from 'md5'

import manifest from './manifest.json' with { type: 'json' }

const URL =
	'https://platform.joinposter.com/api/application.uploadPOSPlatformBundle?format=json'
const FILENAME = 'bundle.js'

async function init() {
	console.log('Started bundle build, you will see a message in a minute...')

	const { execSync } = await import('node:child_process')

	try {
		execSync('bun run build', { stdio: 'inherit' })
	} catch {
		console.log('Error while preparing build')
		return
	}

	try {
		const fileBuffer = await fs.readFile(FILENAME)
		const fileMd5 = md5(fileBuffer)
		const signParts = [
			manifest.applicationId,
			fileMd5,
			manifest.applicationSecret,
		]
		const sign = md5(signParts.join(':'))

		const formData = new FormData()
		formData.append('application_id', manifest.applicationId)
		formData.append('bundle', new Blob([fileBuffer]), FILENAME)
		formData.append('sign', sign)

		const response = await fetch(URL, {
			body: formData,
			method: 'POST',
		})

		const body = await response.text()

		try {
			const parsedBody = JSON.parse(body)

			if (parsedBody.error) {
				throw new Error(JSON.stringify(parsedBody))
			}

			console.log('Bundle successfully sent to Poster', body)
		} catch (error) {
			console.log('Error while send bundle to Poster...')
			console.log(error)
		}
	} catch (error) {
		console.log(`Error while reading ${FILENAME}`)
		console.log(error)
	}
}

init()
