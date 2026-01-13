import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { FlatList, View } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import BlogCard from '@/components/BlogCard'
import { H2, Paragraph } from '@/components/Text'
import { blogPostsQueryOptions } from '@/lib/queries/blog'
import type { BlogPost } from '@/lib/queries/blog'

const UniFlatList = withUnistyles(FlatList)

function handleRenderItem({ item }: { item: unknown }) {
	return <BlogCard post={item as BlogPost} />
}

export function BlogSection() {
	const { data } = useQuery(blogPostsQueryOptions)

	const hasPosts = data && data.length > 0

	return (
		<View style={styles.blogSection}>
			<H2 style={styles.blogTitle}>
				<Trans>Blog</Trans>
			</H2>
			{hasPosts ? (
				<UniFlatList
					contentContainerStyle={styles.blogContainer}
					data={data}
					horizontal
					keyExtractor={(item) => (item as BlogPost).slug}
					renderItem={handleRenderItem}
					showsHorizontalScrollIndicator={false}
				/>
			) : (
				<View style={styles.emptyState}>
					<Paragraph style={styles.emptyText}>
						<Trans>No blog posts available at the moment</Trans>
					</Paragraph>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create((theme, runtime) => ({
	blogContainer: {
		gap: theme.spacing.md,
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
		paddingVertical: theme.spacing.md,
	},
	blogSection: {
		borderBottomColor: theme.colors.gray.border,
		borderBottomWidth: 1,
	},
	blogTitle: {
		paddingLeft: Math.max(runtime.insets.left, theme.layout.screenPadding),
		paddingRight: Math.max(runtime.insets.right, theme.layout.screenPadding),
	},
	emptyState: {
		alignItems: 'center',
		paddingHorizontal: Math.max(
			runtime.insets.left,
			theme.layout.screenPadding,
		),
		paddingVertical: theme.spacing.xl,
	},
	emptyText: {
		color: theme.colors.gray.text,
		textAlign: 'center',
	},
}))
