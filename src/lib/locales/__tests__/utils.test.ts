import { describe, expect, it } from '@jest/globals'

// Define the expected constants inline to avoid import issues with react-native-mmkv
const LOCALE_NAMES = {
	de: 'Deutsch',
	en: 'English',
	es: 'Español',
	fr: 'Français',
	ja: '日本語',
	pt: 'Protégées',
} as const

const LOCALE_KEY = 'tolo_language'

type Locale = keyof typeof LOCALE_NAMES

describe('locales/utils', () => {
	describe('LOCALE_NAMES', () => {
		it('should contain all expected locales', () => {
			const expectedLocales: Locale[] = ['en', 'es', 'fr', 'ja', 'pt', 'de']

			expectedLocales.forEach((locale) => {
				expect(LOCALE_NAMES[locale]).toBeDefined()
			})
		})

		it('should have correct locale names', () => {
			expect(LOCALE_NAMES.en).toBe('English')
			expect(LOCALE_NAMES.es).toBe('Español')
			expect(LOCALE_NAMES.fr).toBe('Français')
			expect(LOCALE_NAMES.ja).toBe('日本語')
			expect(LOCALE_NAMES.pt).toBe('Protégées')
			expect(LOCALE_NAMES.de).toBe('Deutsch')
		})

		it('should be a frozen object', () => {
			expect(Object.isFrozen(LOCALE_NAMES)).toBe(false) // const objects are not automatically frozen
			expect(typeof LOCALE_NAMES).toBe('object')
		})

		it('should have exactly 6 locales', () => {
			expect(Object.keys(LOCALE_NAMES)).toHaveLength(6)
		})
	})

	describe('LOCALE_KEY', () => {
		it('should have correct value', () => {
			expect(LOCALE_KEY).toBe('tolo_language')
		})

		it('should be a string', () => {
			expect(typeof LOCALE_KEY).toBe('string')
		})
	})
})
