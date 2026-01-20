// oxlint-disable jsx-props-no-spreading
import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import type { CSSProperties, ReactNode } from 'react'
import { useUnistyles } from 'react-native-unistyles'

import { H1, H2, H3, H4, H5, H6, Paragraph, Text } from '@/components/Text'

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
			blockquote: ({ children }: { children?: ReactNode }) => (
				<blockquote
					style={{
						borderLeft: `4px solid ${theme.colors.gray.border}`,
						color: theme.colors.gray.solid,
						fontStyle: 'italic',
						margin: `${theme.spacing.md}px 0`,
						paddingLeft: theme.spacing.md,
					}}
				>
					{children}
				</blockquote>
			),
			h1: (props: { children?: ReactNode }) => <H1 {...props} />,
			h2: (props: { children?: ReactNode }) => <H2 {...props} />,
			h3: (props: { children?: ReactNode }) => <H3 {...props} />,
			h4: (props: { children?: ReactNode }) => <H4 {...props} />,
			h5: (props: { children?: ReactNode }) => <H5 {...props} />,
			h6: (props: { children?: ReactNode }) => <H6 {...props} />,
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
			code: ({ children }: { children?: ReactNode }) => (
				<code
					style={{
						backgroundColor: theme.colors.gray.border,
						borderRadius: theme.borderRadius.xs,
						fontFamily: 'monospace',
						padding: `0 ${theme.spacing.xs}px`,
					}}
				>
					{children}
				</code>
			),
			em: ({ children }: { children?: ReactNode }) => (
				<em style={{ fontStyle: 'italic' }}>{children}</em>
			),
			link: ({
				children,
				value,
			}: {
				children?: ReactNode
				value?: { href?: string }
			}) => (
				<a
					href={value?.href}
					rel="noopener noreferrer"
					style={{
						color: theme.colors.verde.solid,
						textDecoration: 'underline',
					}}
					target="_blank"
				>
					{children}
				</a>
			),
			s: ({ children }: { children?: ReactNode }) => (
				<s style={{ textDecoration: 'line-through' }}>{children}</s>
			),
			'strike-through': ({ children }: { children?: ReactNode }) => (
				<s style={{ textDecoration: 'line-through' }}>{children}</s>
			),
			strong: (props: { children?: React.ReactNode }) => (
				<Text weight="bold" {...props} />
			),
			underline: ({ children }: { children?: ReactNode }) => (
				<u style={{ textDecoration: 'underline' }}>{children}</u>
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
