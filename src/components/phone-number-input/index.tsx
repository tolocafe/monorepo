import type { ComponentProps } from 'react'
import { View } from 'react-native'

import { useLingui } from '@lingui/react/macro'
import { StyleSheet } from 'react-native-unistyles'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { TextColorIcon } from '@/components/Icons'
import Input from '@/components/Input'
import { Text } from '@/components/Text'

type PhoneCountry = {
	flag: string
	id: 'MX' | 'US'
	prefix: string // +1, +52, +34
}

type Props = Omit<ComponentProps<typeof Input>, 'onChange'> & {
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
		<View style={styles.container} testID={testID}>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<View style={styles.countryTrigger}>
						<View style={styles.flagAndCode}>
							<Text style={styles.flag}>{selectedCountry?.flag}</Text>
							<Text style={styles.code}>{selectedCountry?.prefix}</Text>
							<View style={styles.chevronWrapper}>
								<TextColorIcon name="chevron-down" size={14} />
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

			<Input
				autoComplete="tel"
				borderless
				editable={!disabled}
				keyboardType="phone-pad"
				onChangeText={handleTextChange}
				style={styles.input}
				textContentType="telephoneNumber"
				value={nsn}
				{...props}
				maxLength={PHONE_NUMBER_MAX_LENGTH - 3}
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
	chevronWrapper: {
		marginLeft: theme.spacing.xs,
	},
	code: {
		color: theme.colors.gray.text,
		paddingHorizontal: 0,
		paddingVertical: 0,
	},
	container: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
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
		color: theme.colors.gray.text,
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
		...theme.typography.input,
		color: theme.colors.gray.text,
		flex: 1,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.sm,
	},
}))

export default PhoneNumberInput
