import type { ComponentProps } from 'react'
import { View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/components/Text'
import { getModifierColor, getModifierIcon } from '@/lib/utils/modifier-tags'

type Props = {
	group?: string
	name: string
	testID?: string
} & Pick<ComponentProps<typeof View>, 'accessibilityLabel'>

export function ModifierTag({
	accessibilityLabel,
	group,
	name,
	testID,
}: Props) {
	const colors = getModifierColor(name, group)
	const icon = getModifierIcon(name)

	return (
		<View
			accessibilityLabel={accessibilityLabel}
			style={styles.tag(colors.bg)}
			testID={testID}
		>
			{icon ? <Ionicons color={icon.color} name={icon.name} size={12} /> : null}
			<Text style={styles.text(colors.text)}>{name}</Text>
		</View>
	)
}

const styles = StyleSheet.create((theme) => ({
	tag: (backgroundColor: string) => ({
		alignItems: 'center',
		backgroundColor,
		borderRadius: theme.borderRadius.sm,
		flexDirection: 'row',
		gap: theme.spacing.xs,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
	}),
	text: (color: string) => ({
		color,
		fontSize: 14,
		fontWeight: '500',
	}),
}))

