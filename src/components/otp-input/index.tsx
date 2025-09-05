import type { ComponentProps } from 'react'
import { useMemo, useRef, useState } from 'react'
import type {
	NativeSyntheticEvent,
	TextInputFocusEventData,
} from 'react-native'
import { Pressable, TextInput, View } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/components/Text'

type Props = Omit<
	ComponentProps<typeof TextInput>,
	'onChange' | 'onComplete' | 'value'
> & {
	/** Disable input */
	disabled?: boolean
	/** Optional blur handler for form libs */
	onBlur?: ComponentProps<typeof TextInput>['onBlur']
	/** Called with new value (digits only) */
	onChange: (value: string) => void
	/** Called automatically when 6 digits are entered */
	onComplete?: (code: string) => void
	/** Test id */
	testID?: string
	/** Current value (digits only). Max length 6 */
	value: string
}

const DIGITS = Array.from({ length: 6 }).map((_, index) => index)

export function OtpInput({
	disabled = false,
	onBlur,
	onChange,
	onComplete,
	testID,
	value,
	...props
}: Props) {
	const inputRef = useRef<TextInput>(null)
	const [focused, setFocused] = useState(false)

	const digits = useMemo(() => {
		const only = value.replaceAll(/\D+/gu, '').slice(0, 6)
		return only.padEnd(6, ' ')
	}, [value])

	const handleChange = (text: string) => {
		const only = text.replaceAll(/\D+/gu, '').slice(0, 6)
		onChange(only)
		if (only.length === 6 && onComplete) {
			onComplete(only)
		}
	}

	const handleBlur = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
		setFocused(false)
		onBlur?.(event)
	}

	return (
		<View style={styles.container} testID={testID}>
			<Pressable
				onPress={() => {
					inputRef.current?.focus()
				}}
				style={styles.boxesRow}
			>
				{DIGITS.map((index) => (
					<View
						key={index}
						style={[
							styles.box,
							focused && value.length === index && styles.boxActive,
						]}
					>
						<Text style={styles.boxText}>{digits[index]}</Text>
					</View>
				))}
			</Pressable>

			<TextInput
				autoComplete="one-time-code"
				autoCorrect={false}
				caretHidden={false}
				contextMenuHidden={false}
				editable={!disabled}
				keyboardType="number-pad"
				maxLength={6}
				onBlur={handleBlur}
				onChangeText={handleChange}
				onFocus={() => setFocused(true)}
				ref={inputRef}
				selectTextOnFocus={false}
				showSoftInputOnFocus
				style={styles.overlayInput}
				textContentType="oneTimeCode"
				value={value}
				{...props}
			/>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	box: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderColor: theme.colors.gray.border,
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		height: 48,
		justifyContent: 'center',
		width: 40,
	},
	boxActive: {
		borderColor: theme.colors.verde.solid,
		borderWidth: 2,
	},
	boxesRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	boxText: {
		color: theme.colors.gray.text,
		textAlign: 'center',
		width: '100%',
		...theme.typography.input,
	},
	container: {
		alignItems: 'center',
		marginHorizontal: 'auto',
		maxWidth: 270,
		width: '100%',
	},
	overlayInput: {
		borderWidth: 0,
		bottom: 0,
		left: 0,
		margin: 0,
		opacity: 0,
		padding: 0,
		position: 'absolute',
		right: 0,
		top: 0,
	},
}))

export default OtpInput
