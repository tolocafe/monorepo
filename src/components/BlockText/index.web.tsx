// oxlint-disable jsx-props-no-spreading
import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import type { CSSProperties, ReactNode } from 'react'
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
			h1: (props: { children?: ReactNode }) => <H1 {...props} />,
			h2: (props: { children?: ReactNode }) => <H2 {...props} />,
			h3: (props: { children?: ReactNode }) => <H3 {...props} />,
			h4: (props: { children?: ReactNode }) => <H4 {...props} />,
			normal: (props: { children?: ReactNode }) => <Paragraph {...props} />,
		},
		list: {
			bullet: ({ children }: { children?: ReactNode }) => (
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
			number: ({ children }: { children?: ReactNode }) => (
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
			bullet: ({ children }: { children?: ReactNode }) => (
				<li style={{ marginBottom: theme.spacing.xs }}>{children}</li>
			),
			number: ({ children }: { children?: ReactNode }) => (
				<li style={{ marginBottom: theme.spacing.xs }}>{children}</li>
			),
		},
		marks: {
			em: ({ children }: { children?: ReactNode }) => (
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
