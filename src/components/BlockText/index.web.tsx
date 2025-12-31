import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import type { CSSProperties } from 'react'
import { useUnistyles } from 'react-native-unistyles'

import { H1, H2, H3, H4, Paragraph, Text } from '@/components/Text'

import type { BlockTextProps } from './types'

/**
 * BlockText component for rendering Portable Text on Web
 *
 * @example
 * ```tsx
 * <BlockText value={portableTextContent} />
 * ```
 */
export default function BlockText({ style, value }: BlockTextProps) {
	const { theme } = useUnistyles()

	if (!value || value.length === 0) {
		return null
	}

	/**
	 * Custom components for rendering Portable Text on Web
	 */
	const components = {
		block: {
			h1: (props: { children?: React.ReactNode }) => <H1 {...props} />,
			h2: (props: { children?: React.ReactNode }) => <H2 {...props} />,
			h3: (props: { children?: React.ReactNode }) => <H3 {...props} />,
			h4: (props: { children?: React.ReactNode }) => <H4 {...props} />,
			normal: (props: { children?: React.ReactNode }) => (
				<Paragraph {...props} />
			),
		},
		list: {
			bullet: ({ children }: { children?: React.ReactNode }) => (
				<ul
					style={{
						marginBottom: theme.spacing.md,
						marginTop: 0,
						paddingLeft: theme.spacing.lg,
					}}
				>
					{children}
				</ul>
			),
			number: ({ children }: { children?: React.ReactNode }) => (
				<ol
					style={{
						marginBottom: theme.spacing.md,
						marginTop: 0,
						paddingLeft: theme.spacing.lg,
					}}
				>
					{children}
				</ol>
			),
		},
		listItem: {
			bullet: ({ children }: { children?: React.ReactNode }) => (
				<li style={{ marginBottom: theme.spacing.xs }}>{children}</li>
			),
			number: ({ children }: { children?: React.ReactNode }) => (
				<li style={{ marginBottom: theme.spacing.xs }}>{children}</li>
			),
		},
		marks: {
			em: ({ children }: { children?: React.ReactNode }) => (
				<em style={{ fontStyle: 'italic' }}>{children}</em>
			),
			strong: (props: { children?: React.ReactNode }) => (
				<Text weight="bold" {...props} />
			),
		},
	} satisfies PortableTextComponents

	return (
		<div
			style={
				{
					color: theme.colors.gray.text,
					fontSize: theme.typography.body.fontSize,
					...style,
				} as CSSProperties
			}
		>
			<PortableText components={components} value={value} />
		</div>
	)
}
