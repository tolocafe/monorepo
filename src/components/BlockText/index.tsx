import { View } from 'react-native'

import { PortableText } from '@portabletext/react-native'
import { StyleSheet } from 'react-native-unistyles'

import type { PortableTextComponents } from '@portabletext/react-native'

import { H1, H2, H3, H4, Paragraph, Text } from '@/components/Text'

import type { BlockTextProps } from './types'

/**
 * Custom components for rendering Portable Text in React Native
 */
const components = {
	block: {
		h1: (props: { children?: React.ReactNode }) => <H1 {...props} />,
		h2: (props: { children?: React.ReactNode }) => <H2 {...props} />,
		h3: (props: { children?: React.ReactNode }) => <H3 {...props} />,
		h4: (props: { children?: React.ReactNode }) => <H4 {...props} />,
		normal: (props: { children?: React.ReactNode }) => <Paragraph {...props} />,
	},
	list: {
		bullet: ({ children }: { children?: React.ReactNode }) => (
			<View style={styles.list}>{children}</View>
		),
		number: ({ children }: { children?: React.ReactNode }) => (
			<View style={styles.list}>{children}</View>
		),
	},
	listItem: {
		bullet: ({ children }: { children?: React.ReactNode }) => (
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
			children?: React.ReactNode
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
		em: ({ children }: { children: React.ReactNode }) => (
			<Paragraph style={styles.italic}>{children}</Paragraph>
		),
		strong: (props: { children: React.ReactNode }) => (
			<Text weight="bold" {...props} />
		),
	},
} satisfies PortableTextComponents

/**
 * BlockText component for rendering Portable Text in React Native
 *
 * @example
 * ```tsx
 * <BlockText value={portableTextContent} />
 * ```
 */
export default function BlockText({ style, value }: BlockTextProps) {
	if (!value || value.length === 0) {
		return null
	}

	return (
		<View style={style}>
			<PortableText components={components} value={value} />
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
