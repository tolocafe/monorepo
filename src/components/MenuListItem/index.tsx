import { Pressable, View } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import Card from '@/components/Card'
import { H4, Text } from '@/components/Text'
import { getImageUrl } from '@/lib/image'
import { getProductBaseCost } from '@/lib/utils/price'

import type { Product } from '@/lib/api'

const UniImage = withUnistyles(Image)

type Props = {
	item: Product
}

export function getItemSize(screenWidth: number) {
	return Math.min((screenWidth - 10) * 0.4, 200)
}

export default function MenuListItem(props: Props) {
	const { item } = props

	const scaleValue = useSharedValue(1)

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scaleValue.get() }],
	}))

	const cost = getProductBaseCost(item, true)
	const hasModifications = 'modifications' in item

	return (
		<Animated.View style={[animatedStyle, styles.menuItemContainer]}>
			<Link asChild href={`/(tabs)/(home)/${item.product_id}`}>
				<Pressable
					onPressIn={() => scaleValue.set(withSpring(0.96))}
					onPressOut={() => scaleValue.set(withSpring(1))}
					style={styles.link}
				>
					<Card padded={false} style={styles.menuItem}>
						<View style={styles.menuItemImageContainer}>
							{item.photo ? (
								<UniImage
									contentFit="cover"
									placeholder={{
										cacheKey: `${item.product_id}-placeholder`,
										uri: getImageUrl(item.photo, {
											blur: 100,
											quality: 20,
											source: 'poster',
											width: 350,
										}),
									}}
									placeholderContentFit="cover"
									source={{
										uri: getImageUrl(item.photo, {
											quality: 85,
											source: 'poster',
											width: 400,
										}),
									}}
									style={styles.image}
									transition={200}
								/>
							) : (
								<View aria-hidden style={styles.image} />
							)}
						</View>
						<View style={styles.menuItemContent}>
							<H4 numberOfLines={2}>{item.product_name}</H4>
							{item.product_production_description ? (
								<Text>{item.product_production_description}</Text>
							) : null}
							<View style={styles.menuItemFooter}>
								<Text>
									{hasModifications ? <Trans>From {cost}</Trans> : cost}
								</Text>
							</View>
						</View>
					</Card>
				</Pressable>
			</Link>
		</Animated.View>
	)
}

const styles = StyleSheet.create((theme, runtime) => {
	const itemSize = getItemSize(runtime.screen.width)
	const ADD_TO_BAG_BUTTON_SIZE = 36

	return {
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
			paddingRight: ADD_TO_BAG_BUTTON_SIZE + theme.spacing.md,
			paddingVertical: theme.spacing.sm,
		},
		menuItemFooter: {
			alignItems: 'center',
			flexDirection: 'row',
			justifyContent: 'space-between',
			minHeight: ADD_TO_BAG_BUTTON_SIZE,
		},
		menuItemImageContainer: {
			backgroundColor: theme.colors.gray.border,
			borderCurve: 'continuous',
			borderTopLeftRadius: theme.borderRadius.lg,
			borderTopRightRadius: theme.borderRadius.lg,
			height: itemSize,
			overflow: 'hidden',
			width: '100%',
		},
	}
})
