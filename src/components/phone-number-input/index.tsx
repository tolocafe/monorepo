import type { ComponentProps } from 'react'
import { TextInput, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react/macro'
import { StyleSheet } from 'react-native-unistyles'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { Text } from '@/components/Text'

type Country = {
	dialCode: string // +1, +52, +34
	flag: string
	id: 'MX' | 'US'
}

type PhoneNumberInputProps = {
	/** Disable input interactions */
	disabled?: boolean
	/** Forward onBlur to parent form libs */
	onBlur?: ComponentProps<typeof TextInput>['onBlur']
	/** Called with updated E.164 value */
	onChange: (value: string) => void
	/** Placeholder for the national number field */
	placeholder?: string
	/** Optional testing id */
	testID?: string
	/** Full phone value in E.164 format (e.g., +15551234567) */
	value: string
}

const COUNTRIES: readonly Country[] = [
	// Default first entry becomes the fallback selection → Mexico first
	{ dialCode: '+52', flag: '🇲🇽', id: 'MX' },
	{ dialCode: '+1', flag: '🇺🇸', id: 'US' },
] as const

export function PhoneNumberInput({
	disabled = false,
	onBlur,
	onChange,
	placeholder,
	testID,
	value,
}: PhoneNumberInputProps) {
	const { t } = useLingui()
	const selectedCountry = getSelectedCountryFromE164(value)
	const nationalDigits = getNationalDigits(value, selectedCountry)
	const formattedNational = formatNationalNumber(
		nationalDigits,
		selectedCountry,
	)

	const handleCountryChange = (country: Country) => {
		const digits = getNationalDigits(value, selectedCountry)
		const nextE164 = digits.length > 0 ? `${country.dialCode}${digits}` : ''
		onChange(nextE164)
	}

	const handleNationalChange = (text: string) => {
		const digits = extractDigits(text)
		const nextE164 =
			digits.length > 0 ? `${selectedCountry.dialCode}${digits}` : ''
		onChange(nextE164)
	}

	return (
		<View style={styles.container} testID={testID}>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<View style={styles.countryTrigger}>
						<View style={styles.flagAndCode}>
							<Text style={styles.flag}>{selectedCountry.flag}</Text>
							<Text style={styles.code}>{selectedCountry.dialCode}</Text>
							<View style={styles.chevronWrapper}>
								<Ionicons
									color={styles.chevron.color}
									name="chevron-down"
									size={14}
								/>
							</View>
						</View>
					</View>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					{COUNTRIES.map((country) => {
						const title =
							country.id === 'US' ? t`United States (+1)` : t`Mexico (+52)`
						return (
							<DropdownMenu.Item
								key={country.id}
								onSelect={() => handleCountryChange(country)}
								textValue={title}
							>
								<DropdownMenu.ItemTitle>{title}</DropdownMenu.ItemTitle>
							</DropdownMenu.Item>
						)
					})}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<TextInput
				autoComplete="tel"
				editable={!disabled}
				keyboardType="phone-pad"
				onBlur={onBlur}
				onChangeText={handleNationalChange}
				placeholder={placeholder}
				style={styles.input}
				textContentType="telephoneNumber"
				value={formattedNational}
			/>
		</View>
	)
}

function extractDigits(input: string): string {
	return input.replaceAll(/\D+/gu, '')
}

function formatNationalNumber(digits: string, country: Country): string {
	if (country.id === 'US') {
		// (123) 456-7890
		const d = digits.slice(0, 10)
		const a = d.slice(0, 3)
		const b = d.slice(3, 6)
		const c = d.slice(6, 10)
		if (d.length <= 3) return a
		if (d.length <= 6) return `(${a}) ${b}`
		return `(${a}) ${b}-${c}`
	}

	// MX and fallback: 123 456 7890 (up to 10)
	const d = digits.slice(0, 10)
	const a = d.slice(0, 3)
	const b = d.slice(3, 6)
	const c = d.slice(6, 10)
	if (d.length <= 3) return a
	if (d.length <= 6) return `${a} ${b}`
	return `${a} ${b} ${c}`
}

// eslint-disable-next-line unicorn/prevent-abbreviations
function getNationalDigits(e164Value: string, country: Country): string {
	const withoutCode = e164Value.startsWith(country.dialCode)
		? e164Value.slice(country.dialCode.length)
		: e164Value
	return extractDigits(withoutCode)
}

// eslint-disable-next-line unicorn/prevent-abbreviations
function getSelectedCountryFromE164(e164Value: string): Country {
	const match = COUNTRIES.filter((c) => e164Value.startsWith(c.dialCode)).sort(
		(a, b) => b.dialCode.length - a.dialCode.length,
	)[0]
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return match ?? COUNTRIES[0]
}

const styles = StyleSheet.create((theme) => ({
	chevron: {
		color: theme.colors.textSecondary,
		fontSize: 12,
		paddingHorizontal: 0,
		paddingVertical: 0,
	},
	chevronWrapper: {
		marginLeft: theme.spacing.xs,
	},
	code: {
		color: theme.colors.text,
		paddingHorizontal: 0,
		paddingVertical: 0,
	},
	container: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		flexDirection: 'row',
	},
	countryTrigger: {
		alignItems: 'center',
		flexDirection: 'row',
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.sm,
	},

	flag: {
		color: theme.colors.text,
		paddingHorizontal: 0,
		paddingVertical: 0,
	},
	flagAndCode: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.xs,
	},
	input: {
		color: theme.colors.text,
		...theme.typography.input,
		flex: 1,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.sm,
	},
}))

export default PhoneNumberInput
