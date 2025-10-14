import type { BrowserWorker } from '@cloudflare/puppeteer'

export type Bindings = Cloudflare.Env & {
	/** APNs for PassKit push notifications */
	APNS_KEY_ID: string
	/** APNs for PassKit push notifications */
	APNS_PRIVATE_KEY: string
	/** APNs for PassKit push notifications */
	APNS_TEAM_ID: string
	ASSETS: Fetcher
	BROADCAST_SECRET: string
	BROWSER: BrowserWorker
	D1_TOLO: D1Database
	EXPO_ACCESS_TOKEN: string
	GA4_API_SECRET: string
	GA4_MEASUREMENT_ID: string
	JWT_PASS_SECRET: string
	JWT_SECRET: string
	KV_CMS: KVNamespace
	KV_OTP: KVNamespace
	KV_SESSIONS: KVNamespace
	POSTER_APPLICATION_SECRET: string
	POSTER_TOKEN: string
	/** Passkit */
	SIGNER_CERT: string
	/** Passkit */
	SIGNER_KEY: string
	/** Passkit */
	SIGNER_PASSPHRASE: string
	STRIPE_SECRET_KEY: string
	STRIPE_WEBHOOK_SECRET: string

	TEST_OTP_CODE: string
	TEST_PHONE_NUMBERS: string
	WEBFLOW_API_TOKEN: string
	WEBFLOW_COFFEES_COLLECTION_ID: string
	WEBFLOW_MENU_COLLECTION_ID: string
	/** Passkit */
	WWDR: string
}
