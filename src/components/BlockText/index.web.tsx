import type { CSSProperties } from 'react'

import { PortableText } from '@portabletext/react'
import { useUnistyles } from 'react-native-unistyles'

import type { BlockTextProps } from './types'

/**
 * BlockText component for rendering Portable Text on Web
 *
 * @example
 * ```tsx
 * <BlockText value={portableTextContent} />
 * ```
 */
export function BlockText({ style, value }: BlockTextProps) {
	const { theme } = useUnistyles()

	if (!value || value.length === 0) {
		return null
	}

	/**
	 * Custom components for rendering Portable Text on Web
	 */
	const components = {
		block: {
			h1: ({ children }: { children?: React.ReactNode }) => (
				<h1
					style={{
						color: theme.colors.gray.text,
						fontSize: theme.typography.h1.fontSize,
						fontWeight: theme.typography.h1.fontWeight,
						marginBottom: theme.spacing.lg,
						marginTop: 0,
					}}
				>
					{children}
				</h1>
			),
			h2: ({ children }: { children?: React.ReactNode }) => (
				<h2
					style={{
						color: theme.colors.gray.text,
						fontSize: theme.typography.h2.fontSize,
						fontWeight: theme.typography.h2.fontWeight,
						marginBottom: theme.spacing.md,
						marginTop: 0,
					}}
				>
					{children}
				</h2>
			),
			h3: ({ children }: { children?: React.ReactNode }) => (
				<h3
					style={{
						color: theme.colors.gray.text,
						fontSize: theme.typography.h3.fontSize,
						fontWeight: theme.typography.h3.fontWeight,
						marginBottom: theme.spacing.md,
						marginTop: 0,
					}}
				>
					{children}
				</h3>
			),
			h4: ({ children }: { children?: React.ReactNode }) => (
				<h4
					style={{
						color: theme.colors.gray.text,
						fontSize: theme.typography.h4.fontSize,
						fontWeight: theme.typography.h4.fontWeight,
						marginBottom: theme.spacing.sm,
						marginTop: 0,
					}}
				>
					{children}
				</h4>
			),
			normal: ({ children }: { children?: React.ReactNode }) => (
				<p
					style={{
						color: theme.colors.gray.text,
						marginBottom: theme.spacing.md,
						marginTop: 0,
					}}
				>
					{children}
				</p>
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
			strong: ({ children }: { children?: React.ReactNode }) => (
				<strong style={{ fontWeight: theme.fontWeights.semibold }}>
					{children}
				</strong>
			),
		},
	}

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
