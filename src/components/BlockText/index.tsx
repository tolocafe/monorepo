import { View } from 'react-native'

import { PortableText } from '@portabletext/react-native'
import { StyleSheet } from 'react-native-unistyles'

import { H1, H2, H3, H4, Paragraph } from '@/components/Text'

import type { BlockTextProps } from './types'

/**
 * Custom components for rendering Portable Text in React Native
 */
const components = {
	block: {
		h1: ({ children }: { children: React.ReactNode }) => <H1>{children}</H1>,
		h2: ({ children }: { children: React.ReactNode }) => <H2>{children}</H2>,
		h3: ({ children }: { children: React.ReactNode }) => <H3>{children}</H3>,
		h4: ({ children }: { children: React.ReactNode }) => <H4>{children}</H4>,
		normal: ({ children }: { children: React.ReactNode }) => (
			<Paragraph style={styles.paragraph}>{children}</Paragraph>
		),
	},
	list: {
		bullet: ({ children }: { children: React.ReactNode }) => (
			<View style={styles.list}>{children}</View>
		),
		number: ({ children }: { children: React.ReactNode }) => (
			<View style={styles.list}>{children}</View>
		),
	},
	listItem: {
		bullet: ({ children }: { children: React.ReactNode }) => (
			<View style={styles.listItem}>
				<Paragraph style={styles.bullet}>•</Paragraph>
				<View style={styles.listItemContent}>
					<Paragraph>{children}</Paragraph>
				</View>
			</View>
		),
		number: ({
			children,
			index,
		}: {
			children: React.ReactNode
			index: number
		}) => (
			<View style={styles.listItem}>
				<Paragraph style={styles.bullet}>{index + 1}.</Paragraph>
				<View style={styles.listItemContent}>
					<Paragraph>{children}</Paragraph>
				</View>
			</View>
		),
	},
	marks: {
		strong: ({ children }: { children: React.ReactNode }) => (
			<Paragraph style={styles.strong}>{children}</Paragraph>
		),
		em: ({ children }: { children: React.ReactNode }) => (
			<Paragraph style={styles.italic}>{children}</Paragraph>
		),
	},
}

/**
 * BlockText component for rendering Portable Text in React Native
 *
 * @example
 * ```tsx
 * <BlockText value={portableTextContent} />
 * ```
 */
export function BlockText({ value, style }: BlockTextProps) {
	if (!value || value.length === 0) {
		return null
	}

	return (
		<View style={style}>
			<PortableText value={value} components={components} />
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	bullet: {
		marginRight: theme.spacing.sm,
		minWidth: 20,
	},
	italic: {
		fontStyle: 'italic',
	},
	list: {
		marginVertical: theme.spacing.sm,
	},
	listItem: {
		flexDirection: 'row',
		marginBottom: theme.spacing.xs,
	},
	listItemContent: {
		flex: 1,
	},
	paragraph: {
		marginBottom: theme.spacing.md,
	},
	strong: {
		fontWeight: theme.fontWeights.semibold,
	},
}))
