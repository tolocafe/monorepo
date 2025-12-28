import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { Pressable, View } from 'react-native'

import { StyleSheet } from 'react-native-unistyles'

import Card from '@/components/Card'
import { TextColorIcon } from '@/components/Icons'
import { Label, Text } from '@/components/Text'

export type ListItemAccessoryProps = {
	children: ReactNode
	style?: object
}

export type ListItemIconProps = {
	children: ReactNode
	style?: object
}

export type ListItemLabelProps = {
	children: ReactNode
	color?: 'primary' | 'secondary'
	style?: object
}

export type ListItemProps = {
	accessibilityRole?: 'button' | 'link'
	centered?: boolean
	chevron?: boolean
	children?: ReactNode
	disabled?: boolean
	onPress?: () => void
	style?: object
	testID?: string
}

export type ListItemTextProps = {
	children: ReactNode
	color?: 'primary' | 'secondary'
	style?: object
}

export type ListProps = {
	children: ReactNode
	style?: object
	testID?: string
}

export function List({ children, style, testID }: ListProps) {
	const items = Children.toArray(children).filter(
		(child) => typeof child !== 'boolean' && isValidElement(child),
	) as ReactElement[]

	return (
		<Card style={style} testID={testID}>
			{items.map((child, index, items) => {
				const key =
					isValidElement(child) && child.key !== null ? child.key : index

				const showDivider = index < items.length - 1

				return (
					<View key={key}>
						{child}
						{showDivider ? <View style={styles.divider} /> : null}
					</View>
				)
			})}
		</Card>
	)
}

export function ListItem({
	accessibilityRole,
	centered = false,
	chevron = false,
	children,
	disabled = false,
	onPress,
	style,
	testID,
}: ListItemProps) {
	// Extract child components
	const childrenArray = Children.toArray(children)
	const iconChild = childrenArray.find(
		(child) => isValidElement(child) && child.type === ListItemIcon,
	)
	const labelChild = childrenArray.find(
		(child) => isValidElement(child) && child.type === ListItemLabel,
	)
	const textChild = childrenArray.find(
		(child) => isValidElement(child) && child.type === ListItemText,
	)
	const accessoryChild = childrenArray.find(
		(child) => isValidElement(child) && child.type === ListItemAccessory,
	)
	const otherChildren = childrenArray.filter(
		(child) =>
			!isValidElement(child) ||
			(child.type !== ListItemIcon &&
				child.type !== ListItemLabel &&
				child.type !== ListItemText &&
				child.type !== ListItemAccessory),
	)

	const showChevron = chevron && !accessoryChild

	styles.useVariants({ centered })

	return (
		<Pressable
			accessibilityRole={accessibilityRole}
			disabled={disabled || !onPress}
			onPress={onPress}
			style={[styles.itemRow, style]}
			testID={testID}
		>
			{iconChild}

			{/* Main content area */}
			<View style={styles.contentContainer}>
				{labelChild}
				{textChild}
				{otherChildren}
			</View>

			{/* Accessory or chevron */}
			{accessoryChild ||
				(showChevron && <TextColorIcon name="chevron-forward" size={20} />)}
		</Pressable>
	)
}

function ListItemAccessory({ children, style }: ListItemAccessoryProps) {
	return <View style={[styles.accessoryContainer, style]}>{children}</View>
}

function ListItemIcon({ children, style }: ListItemIconProps) {
	return <View style={[styles.leftIconContainer, style]}>{children}</View>
}

function ListItemLabel({ children, color, style }: ListItemLabelProps) {
	styles.useVariants({ labelColor: color })

	return <Label style={[styles.label, style]}>{children}</Label>
}

function ListItemText({ children, color, style }: ListItemTextProps) {
	styles.useVariants({ textColor: color })

	return <Text style={[styles.text, style]}>{children}</Text>
}

// Attach compound components
ListItem.Label = ListItemLabel
ListItem.Text = ListItemText
ListItem.Icon = ListItemIcon
ListItem.Accessory = ListItemAccessory

const styles = StyleSheet.create((theme) => ({
	accessoryContainer: {
		marginLeft: theme.spacing.sm,
	},
	contentContainer: {
		alignItems: 'center',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		variants: {
			centered: {
				true: {
					justifyContent: 'center',
				},
			},
		},
	},
	divider: {
		backgroundColor: theme.colors.gray.text,
		height: 1,
		marginVertical: 0,
		opacity: 0.1,
	},
	itemRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: theme.spacing.md,
		variants: {
			centered: {
				true: {
					justifyContent: 'center',
				},
			},
		},
	},
	label: {
		fontWeight: '600',
		variants: {
			labelColor: {
				primary: {
					color: theme.colors.verde.solid,
				},
				secondary: {
					color: theme.colors.crema.solid,
				},
			},
		},
	},
	leftIconContainer: {
		marginRight: theme.spacing.sm,
	},
	text: {
		flex: 2,
		textAlign: 'right',
		variants: {
			textColor: {
				primary: {
					color: theme.colors.verde.solid,
				},
				secondary: {
					color: theme.colors.crema.solid,
				},
			},
		},
	},
}))
