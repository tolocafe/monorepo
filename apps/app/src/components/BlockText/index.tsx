// oxlint-disable jsx-props-no-spreading
import { PortableText } from '@portabletext/react-native'
import type { PortableTextComponents } from '@portabletext/react-native'
import { ReactNode } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { H1, H2, H3, H4, H5, H6, Paragraph, Text } from '@/components/Text'

import type { BlockTextProps } from './types'

function handleLinkPress(href: string) {
	Linking.openURL(href)
}

/**
 * Custom components for rendering Portable Text in React Native
 */
const components = {
	block: {
		blockquote: ({ children }: { children?: React.ReactNode }) => (
			<View style={styles.blockquote}>
				<Paragraph style={styles.blockquoteText}>{children}</Paragraph>
			</View>
		),
		h1: (props: { children?: React.ReactNode }) => <H1 {...props} />,
		h2: (props: { children?: React.ReactNode }) => <H2 {...props} />,
		h3: (props: { children?: React.ReactNode }) => <H3 {...props} />,
		h4: (props: { children?: React.ReactNode }) => <H4 {...props} />,
		h5: (props: { children?: React.ReactNode }) => <H5 {...props} />,
		h6: (props: { children?: React.ReactNode }) => <H6 {...props} />,
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
		code: ({ children }: { children?: React.ReactNode }) => (
			<Text style={styles.code}>{children}</Text>
		),
		em: ({ children }: { children: React.ReactNode }) => (
			<Text style={styles.italic}>{children}</Text>
		),
		link: ({
			children,
			value,
		}: {
			children?: React.ReactNode
			value?: { href?: string }
		}) => (
			<Pressable onPress={() => value?.href && handleLinkPress(value.href)}>
				<Text style={styles.link}>{children}</Text>
			</Pressable>
		),
		'strike-through': ({ children }: { children?: React.ReactNode }) => (
			<Text style={styles.strikeThrough}>{children}</Text>
		),
		strong: (props: { children: ReactNode }) => (
			// oxlint-disable-next-line jsx-props-no-spreading
			<Text weight="bold" {...props} />
		),
		underline: ({ children }: { children?: React.ReactNode }) => (
			<Text style={styles.underline}>{children}</Text>
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
	blockquote: {
		borderLeftColor: theme.colors.gray.border,
		borderLeftWidth: 4,
		marginVertical: theme.spacing.md,
		paddingLeft: theme.spacing.md,
	},
	blockquoteText: {
		color: theme.colors.gray.solid,
		fontStyle: 'italic',
	},
	bullet: {
		marginRight: theme.spacing.sm,
		minWidth: 20,
	},
	code: {
		backgroundColor: theme.colors.gray.border,
		borderRadius: theme.borderRadius.xs,
		fontFamily: 'monospace',
		paddingHorizontal: theme.spacing.xs,
	},
	italic: {
		fontStyle: 'italic',
	},
	link: {
		color: theme.colors.verde.solid,
		textDecorationLine: 'underline',
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
	strikeThrough: {
		textDecorationLine: 'line-through',
	},
	strong: {
		fontWeight: theme.fontWeights.semibold,
	},
	underline: {
		textDecorationLine: 'underline',
	},
}))
