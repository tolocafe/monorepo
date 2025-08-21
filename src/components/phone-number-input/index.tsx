import type { ComponentProps } from 'react'
import { TextInput, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { useLingui } from '@lingui/react/macro'
import { StyleSheet } from 'react-native-unistyles'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { Text } from '@/components/Text'

type PhoneCountry = {
	flag: string
	id: 'MX' | 'US'
	prefix: string // +1, +52, +34
}

type Props = Omit<ComponentProps<typeof TextInput>, 'onChange'> & {
	/** Disable input interactions */
	disabled?: boolean
	/** Called with updated E.164 value */
	onChange: (value: string) => void
	testID?: string
	value: string
}

const phoneCountries: readonly PhoneCountry[] = [
	// Default first entry becomes the fallback selection → Mexico first
	{ flag: '🇲🇽', id: 'MX', prefix: '+52' },
	{ flag: '🇺🇸', id: 'US', prefix: '+1' },
] as const

export function PhoneNumberInput({
	disabled = false,
	onChange,
	testID,
	value,
	...props
}: Props) {
	const { t } = useLingui()

	const [intPrefix, nsn] = getPhoneParts(
		value,
		phoneCountries.at(0)?.prefix as string,
	)
	const selectedCountry = phoneCountries.find((c) => c.prefix === intPrefix)

	const handleCountryChange = (dialCode: string) => {
		// const digits = getNationalDigits(value, selectedCountry)
		// const nextE164 = digits.length > 0 ? `${dialCode}${digits}` : ''
		onChange(dialCode + value)
	}

	const handleTextChange = (text: string) => {
		const [nextIntPrefix] = getPhoneParts(text)

		if (nextIntPrefix) {
			onChange(nextIntPrefix + text.replace(nextIntPrefix, ''))
		} else {
			// // Simply pass the cleaned E164 format - let the parent handle the rest
			onChange((intPrefix as string) + text)
		}
	}

	return (
		<View style={styles.container} testID={testID}>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<View style={styles.countryTrigger}>
						<View style={styles.flagAndCode}>
							<Text style={styles.flag}>{selectedCountry?.flag}</Text>
							<Text style={styles.code}>{selectedCountry?.prefix}</Text>
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
					{phoneCountries.map((country) => {
						const title =
							country.id === 'US' ? t`United States (+1)` : t`Mexico (+52)`
						return (
							<DropdownMenu.Item
								key={country.id}
								onSelect={() => handleCountryChange(country.prefix)}
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
				maxLength={10}
				onChangeText={handleTextChange}
				style={styles.input}
				textContentType="telephoneNumber"
				value={nsn}
				{...props}
			/>
		</View>
	)
}

/**
 * Return international prefix and nsn (national subscriber number)
 */
function getPhoneParts(
	// eslint-disable-next-line unicorn/prevent-abbreviations
	e164Value: string,
	defaultPrefix?: string,
) {
	const internationalPrefix = phoneCountries.find((c) =>
		e164Value.startsWith(c.prefix),
	)?.prefix
	const nsn = e164Value.slice(internationalPrefix?.length ?? 0)

	return [internationalPrefix ?? defaultPrefix, nsn]
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
