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

	const handleCountryChange = (nextIntPrefix: string) => {
		onChange(nextIntPrefix + nsn)
	}

	const handleTextChange = (text: string) => {
		const [nextIntPrefix, nextNsn] = getPhoneParts(text, intPrefix)

		onChange(nextIntPrefix + nextNsn)
	}

	return (
		<View
			style={[styles.container, disabled && styles.containerDisabled]}
			testID={testID}
		>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild disabled={disabled}>
					<View style={styles.countryTrigger}>
						<View style={styles.flagAndCode}>
							<Text style={[styles.flag, disabled && styles.textDisabled]}>
								{selectedCountry?.flag}
							</Text>
							<Text style={[styles.code, disabled && styles.textDisabled]}>
								{selectedCountry?.prefix}
							</Text>
							<View style={styles.chevronWrapper}>
								<Ionicons
									color={
										disabled ? styles.textDisabled.color : styles.chevron.color
									}
									name="chevron-down"
									size={14}
								/>
							</View>
						</View>
					</View>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content style={dropdownContentStyle}>
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
				onChangeText={handleTextChange}
				placeholderTextColor={disabled ? styles.textDisabled.color : '#ddd'}
				style={[styles.input, disabled && styles.inputDisabled]}
				textContentType="telephoneNumber"
				value={nsn}
				{...props}
			/>
		</View>
	)
}

const PHONE_NUMBER_MAX_LENGTH = 13

/**
 * Return international prefix and nsn (national subscriber number)
 */
function getPhoneParts(text: string, defaultPrefix: string) {
	const cleanE164Value = text
		.replaceAll(/[^\d+]/gu, '')
		.slice(0, PHONE_NUMBER_MAX_LENGTH)

	const internationalPrefix =
		phoneCountries.find((country) => cleanE164Value.startsWith(country.prefix))
			?.prefix ?? defaultPrefix

	const nsn = cleanE164Value.replace(internationalPrefix, '')

	return [internationalPrefix, nsn]
}

const dropdownContentStyle = {
	backgroundColor: '#fff',
	borderRadius: 10,
	display: 'flex',
	flexDirection: 'column',
	fontFamily: 'system-ui',
	gap: 10,
	maxHeight: 200,
	padding: 10,
} as const

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
	containerDisabled: {
		backgroundColor: theme.colors.background,
		borderColor: theme.colors.textTertiary,
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
		paddingLeft: theme.spacing.xs,
	},
	input: {
		color: theme.colors.text,
		...theme.typography.input,
		flex: 1,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.sm,
	},
	inputDisabled: {
		color: theme.colors.textSecondary,
	},
	textDisabled: {
		color: theme.colors.textSecondary,
	},
}))

export default PhoneNumberInput
