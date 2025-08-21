export type Bindings = Cloudflare.Env & {
	D1_TOLO: D1Database
	JWT_SECRET: string
	KV_CMS: KVNamespace
	KV_OTP: KVNamespace
	KV_SESSIONS: KVNamespace
	POSTER_TOKEN: string
	STRIPE_SECRET_KEY: string
	STRIPE_WEBHOOK_SECRET: string
	TEST_OTP_CODE: string
	TEST_PHONE_NUMBERS: string
	WEBFLOW_API_TOKEN: string
	WEBFLOW_MENU_COLLECTION_ID: string
}
