import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import type { Product } from '@tolo/common/api'
import { Image } from 'expo-image'
import { Link, LinkTrigger } from 'expo-router'
import { Pressable, View } from 'react-native'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Card from '@/components/Card'
import { Text, H4 } from '@/components/Text'
import { getImageUrl } from '@/lib/image'
import { getProductBaseCost } from '@/lib/utils/price'

const UniImage = withUnistyles(Image)

const tagLabels = {
	FAVORITE: msg`Favorite`,
	NEW: msg`New`,
	SEASONAL: msg`Seasonal`,
	SPECIAL: msg`Special`,
} as const

type Props = {
	item: Product
}

export function getItemSize(screenWidth: number) {
	return Math.min((screenWidth - 10) * 0.4, 200)
}

export default function MenuListItem(props: Props) {
	const { item } = props
	const { _ } = useLingui()

	const scaleValue = useSharedValue(1)

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scaleValue.value }],
	}))

	const cost = getProductBaseCost(item, true)
	const hasModifications = 'modifications' in item

	return (
		<Animated.View style={[animatedStyle, styles.menuItemContainer]}>
			<Link href={`/products/${item.product_id}`} asChild>
				{/* TODO: maybe add a preview and menu */}
				<LinkTrigger>
					<Pressable
						onPressIn={() => {
							scaleValue.value = withSpring(1.07)
						}}
						onPressOut={() => {
							scaleValue.value = withSpring(1)
						}}
						style={styles.link}
					>
						<Card padded={false} style={styles.menuItem}>
							<View style={styles.menuItemImageContainer}>
								{item.photo ? (
									<UniImage
										contentFit="cover"
										placeholder={{
											cacheKey: `${item.photo}-placeholder`,
											uri: getImageUrl(item.photo, {
												blur: 100,
												quality: 20,
												source: 'sanity',
												width: 300,
											}),
										}}
										placeholderContentFit="cover"
										source={{
											cacheKey: `${item.photo}-image`,
											uri: getImageUrl(item.photo, {
												quality: 90,
												source: 'sanity',
												width: 300,
											}),
										}}
										style={styles.image}
										transition={200}
									/>
								) : (
									<View aria-hidden />
								)}
								{item.tag && item.tag in tagLabels ? (
									<View style={styles.tag}>
										<Text style={styles.tagText}>{_(tagLabels[item.tag])}</Text>
									</View>
								) : null}
							</View>
							<View style={styles.menuItemContent}>
								<H4 numberOfLines={2}>{item.name}</H4>
								{item.excerpt ? (
									<Text numberOfLines={2} style={styles.excerpt}>
										{item.excerpt}
									</Text>
								) : null}
								<View style={styles.menuItemFooter}>
									<Text>
										{hasModifications ? <Trans>From {cost}</Trans> : cost}
									</Text>
								</View>
							</View>
						</Card>
					</Pressable>
				</LinkTrigger>
			</Link>
		</Animated.View>
	)
}

const styles = StyleSheet.create((theme, runtime) => {
	const itemSize = getItemSize(runtime.screen.width)
	const ADD_TO_BAG_BUTTON_SIZE = 36

	return {
		excerpt: {
			color: theme.colors.gray.text,
			fontSize: theme.fontSizes.sm,
		},
		image: {
			flex: 1,
			objectFit: 'cover',
		},

		link: {
			flex: 1,
		},
		menuItem: {
			height: '100%',
		},
		menuItemContainer: {
			position: 'relative',
			width: itemSize,
		},
		menuItemContent: {
			flex: 1,
			gap: theme.spacing.xs,
			justifyContent: 'space-between',
			padding: 10,
			paddingVertical: theme.spacing.sm,
		},
		menuItemFooter: {
			alignItems: 'center',
			flexDirection: 'row',
			justifyContent: 'flex-end',
			minHeight: ADD_TO_BAG_BUTTON_SIZE,
		},
		menuItemImageContainer: {
			backgroundColor: theme.colors.primary.interactive,
			borderCurve: 'continuous',
			borderTopLeftRadius: theme.borderRadius.lg,
			borderTopRightRadius: theme.borderRadius.lg,
			height: itemSize,
			overflow: 'hidden',
			width: '100%',
		},
		tag: {
			backgroundColor: theme.colors.secondary.solid,
			borderRadius: theme.borderRadius.full,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.xxs,
			position: 'absolute',
			right: theme.spacing.sm,
			top: theme.spacing.sm,
		},
		tagText: {
			color: '#FFFFFF',
			fontSize: theme.fontSizes.xs,
			fontWeight: theme.fontWeights.semibold,
		},
	}
})
