/* eslint-disable no-console */
/* eslint-disable unicorn/prefer-regexp-test */
import fs from 'node:fs'

import md5 from 'md5'
import r from 'request'
import shell from 'shelljs'

import manifest from './manifest.json' with { type: 'json' }

const URL =
	'https://platform.joinposter.com/api/application.uploadPOSPlatformBundle?format=json'
const FILENAME = 'bundle.js'

;(function init() {
	console.log('Started bundle build, you will see a message in a minute...')

	if (!shell.exec('bun run build')) {
		console.log('Error while preparing build')
		return
	}

	fs.readFile(FILENAME, (error, buf) => {
		if (error) {
			console.log(`Error while reading ${FILENAME}`)
			console.log(error)
		} else {
			const fileMd5 = md5(buf),
				signParts = [
					manifest.applicationId,
					fileMd5,
					manifest.applicationSecret,
				],
				sign = md5(signParts.join(':'))

			const formData = {
				application_id: manifest.applicationId,
				bundle: fs.createReadStream(`./${FILENAME}`),
				sign,
			}

			r.post(
				{
					formData,
					url: URL,
				},
				(error, _response, body) => {
					if (error) {
						console.log('Error while send bundle to Poster...')
						console.log(error)
					} else {
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
					}
				},
			)
		}
	})
})()
