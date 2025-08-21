import type { ComponentProps } from 'react'
import { useMemo, useRef } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/components/Text'
import { filterDigitsWithLimit } from '@/lib/utils/text-input'

type OtpInputProps = {
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

export function OtpInput({
	disabled = false,
	onBlur,
	onChange,
	onComplete,
	testID,
	value,
}: OtpInputProps) {
	const inputRef = useRef<TextInput>(null)

	const digits = useMemo(() => {
		const only = filterDigitsWithLimit(value, 6)
		return only.padEnd(6, ' ')
	}, [value])

	const handleChange = (text: string) => {
		const only = filterDigitsWithLimit(text, 6)
		onChange(only)
		if (only.length === 6 && onComplete) {
			onComplete(only)
		}
	}

	return (
		<View style={styles.container} testID={testID}>
			<Pressable onPress={() => inputRef.current?.focus()}>
				{/* Display boxes */}
				<View style={styles.boxesRow}>
					{Array.from({ length: 6 }).map((_, index) => (
						<View
							key={index}
							style={[styles.box, value.length === index && styles.boxActive]}
						>
							<Text style={styles.boxText}>{digits[index]}</Text>
						</View>
					))}
				</View>
			</Pressable>

			{/* Transparent overlay input to allow paste/select/focus without layout shift */}
			<TextInput
				autoComplete="one-time-code"
				autoCorrect={false}
				caretHidden={false}
				contextMenuHidden={false}
				editable={!disabled}
				keyboardType="number-pad"
				maxLength={6}
				onBlur={onBlur}
				onChangeText={handleChange}
				ref={inputRef}
				selectTextOnFocus={false}
				showSoftInputOnFocus
				style={styles.overlayInput}
				textContentType="oneTimeCode"
				value={value}
			/>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	box: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		height: 48,
		justifyContent: 'center',
		width: 40,
	},
	boxActive: {
		borderColor: theme.colors.primary,
	},
	boxesRow: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'center',
	},
	boxText: {
		color: theme.colors.text,
		textAlign: 'center',
		width: '100%',
		...theme.typography.input,
	},
	container: {
		alignItems: 'center',
	},
	overlayInput: {
		borderWidth: 0,
		bottom: 0,
		left: 0,
		margin: 0,
		opacity: 0.01,
		padding: 0,
		position: 'absolute',
		right: 0,
		top: 0,
	},
}))

export default OtpInput
