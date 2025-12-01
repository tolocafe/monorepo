import { Pressable, TouchableOpacity, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { Trans } from '@lingui/react/macro'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'

import { Card } from '@/components/Card'
import { H4, Text } from '@/components/Text'
import { getImageUrl } from '@/lib/image'
import { getProductBaseCost } from '@/lib/utils/price'

import type { Product } from '@/lib/api'

const UniImage = withUnistyles(Image)
const UniIonicons = withUnistyles(Ionicons, (theme) => ({
	color: theme.colors.gray.background,
}))

type Props = {
	item: Product
	onAddToBag: (item: Product) => void
}

export default function MenuListItem(props: Props) {
	const { item, onAddToBag } = props

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
											width: 350,
										}),
									}}
									placeholderContentFit="cover"
									source={{
										uri: getImageUrl(item.photo, {
											quality: 85,
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
			<View style={styles.menuItemActions}>
				<TouchableOpacity
					disabled={!cost}
					onPress={() => onAddToBag(item)}
					style={styles.addToBagButton}
				>
					<UniIonicons name="add" size={26} />
				</TouchableOpacity>
			</View>
		</Animated.View>
	)
}

const ADD_TO_BAG_BUTTON_SIZE = 36

const styles = StyleSheet.create((theme, runtime) => {
	const itemSize = Math.min((runtime.screen.width - 10) * 0.4, 200)

	return {
		addToBagButton: {
			alignItems: 'center',
			backgroundColor: theme.colors.verde.solid,
			borderRadius: theme.borderRadius.full,
			height: 36,
			justifyContent: 'center',
			width: 36,
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
		menuItemActions: {
			alignItems: 'center',
			bottom: theme.spacing.sm,
			flexDirection: 'row',
			gap: theme.spacing.sm,
			position: 'absolute',
			right: theme.spacing.sm,
			zIndex: 1,
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
