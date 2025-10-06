import type { ReactNode } from 'react'
import { Text as RNText } from 'react-native'
import type { TextProps as RNTextProps } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

export type BaseTextProps = RNTextProps & {
	align?: 'center' | 'left' | 'right'
	children?: ReactNode
	weight?: 'bold'
}

export function H1({
	accessibilityRole = 'header',
	style,
	...rest
}: BaseTextProps) {
	return (
		<Text
			accessibilityRole={accessibilityRole}
			{...rest}
			style={[styles.h1, style]}
		/>
	)
}

export function H2({
	accessibilityRole = 'header',
	style,
	...rest
}: BaseTextProps) {
	return (
		<Text
			accessibilityRole={accessibilityRole}
			{...rest}
			style={[styles.h2, style]}
		/>
	)
}

export function H3({
	accessibilityRole = 'header',
	style,
	...rest
}: BaseTextProps) {
	return (
		<Text
			accessibilityRole={accessibilityRole}
			{...rest}
			style={[styles.h3, style]}
		/>
	)
}

export function H4({
	accessibilityRole = 'header',
	style,
	...rest
}: BaseTextProps) {
	return (
		<Text
			accessibilityRole={accessibilityRole}
			{...rest}
			style={[styles.h4, style]}
		/>
	)
}

export function Label({ style, ...rest }: BaseTextProps) {
	return <Text {...rest} style={[styles.label, style]} />
}

export function Paragraph({ style, ...rest }: BaseTextProps) {
	return <Text {...rest} style={[styles.paragraph, style]} />
}

export function Text({ align, style, weight, ...rest }: BaseTextProps) {
	styles.useVariants({ align, weight })

	return <RNText {...rest} style={[styles.text, style]} />
}

const styles = StyleSheet.create((theme) => ({
	h1: {
		fontSize: theme.typography.h1.fontSize,
		fontWeight: theme.typography.h1.fontWeight,
	},
	h2: {
		fontSize: theme.typography.h2.fontSize,
		fontWeight: theme.typography.h2.fontWeight,
	},
	h3: {
		fontSize: theme.typography.h3.fontSize,
		fontWeight: theme.typography.h3.fontWeight,
	},
	h4: {
		fontSize: theme.typography.h4.fontSize,
		fontWeight: theme.typography.h4.fontWeight,
	},
	label: {
		fontSize: theme.typography.body.fontSize,
		fontWeight: theme.typography.body.fontWeight,
	},
	paragraph: {
		fontSize: theme.typography.body.fontSize,
		lineHeight: theme.fontSizes.xl,
		marginBottom: theme.spacing.sm,
	},
	text: {
		color: theme.colors.gray.text,
		fontSize: theme.typography.body.fontSize,
		variants: {
			align: {
				center: {
					textAlign: 'center',
				},
				default: {
					textAlign: 'left',
				},
				left: {
					textAlign: 'left',
				},
				right: {
					textAlign: 'right',
				},
			},
			weight: {
				bold: {
					fontWeight: '700',
				},
			},
		},
	},
}))
