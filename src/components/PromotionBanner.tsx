import { Pressable, View } from 'react-native'

import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { H3, Paragraph } from '@/components/Text'
import { getImageUrl } from '@/lib/image'

import type { Promotion } from '@/lib/api'

type PromotionBannerProps = {
	index?: number
	promotion: Promotion
}

const UniImage = withUnistyles(Image)

export default function PromotionBanner({
	index,
	promotion,
}: PromotionBannerProps) {
	const handlePress = () => {
		if (promotion.productId) {
			router.push(`/${promotion.productId}`)
		}
	}

	return (
		<Pressable
			accessibilityHint={promotion.subtitle}
			accessibilityLabel={promotion.title}
			data-testid={
				typeof index === 'number'
					? `promotion-banner-${index}`
					: 'promotion-banner'
			}
			onPress={handlePress}
			style={styles.container}
		>
			<View accessible={false} style={styles.imageContainer}>
				<UniImage
					alt={promotion.title}
					contentFit="cover"
					placeholder={{
						cacheKey: `${promotion.id}-placeholder`,
						uri: getImageUrl(promotion.image, {
							blur: 100,
							quality: 20,
							width: 400,
						}),
					}}
					placeholderContentFit="cover"
					source={{
						uri: getImageUrl(promotion.image, { quality: 85, width: 1200 }),
					}}
					style={styles.image}
					transition={150}
				/>
			</View>
			<View style={styles.caption}>
				<H3 numberOfLines={1} style={styles.title}>
					{promotion.title}
				</H3>
				{promotion.subtitle ? (
					<Paragraph numberOfLines={1} style={styles.subtitle}>
						{promotion.subtitle}
					</Paragraph>
				) : null}
			</View>
		</Pressable>
	)
}

const styles = StyleSheet.create((theme) => ({
	caption: {
		gap: 2,
		paddingHorizontal: theme.spacing.sm,
		paddingTop: theme.spacing.xs,
	},
	container: {
		width: 300,
	},
	image: {
		height: 160,
		objectFit: 'cover',
		width: '100%',
	},
	imageContainer: {
		backgroundColor: theme.colors.gray.border,
		borderRadius: theme.borderRadius.lg,
		overflow: 'hidden',
		width: '100%',
	},
	subtitle: {
		color: theme.colors.gray.solid,
		fontSize: theme.fontSizes.sm,
	},
	title: {
		fontSize: theme.fontSizes.lg,
	},
}))
