import type Ionicons from '@expo/vector-icons/Ionicons'
import {
	Children,
	cloneElement,
	createContext,
	isValidElement,
	useContext,
} from 'react'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { TextColorIcon } from '~/components/Icons'
import { Text } from '~/components/Text'

type IconName = ComponentProps<typeof Ionicons>['name']

type SegmentedControlContextValue = {
	onChange: (value: string) => void
	value: string
}

const SegmentedControlContext =
	createContext<null | SegmentedControlContextValue>(null)

type SegmentedControlProps<T extends string> = {
	children: ReactNode
	onChange: (value: T) => void
	value: T
}

type SegmentProps = {
	disabled?: boolean
	icon?: IconName
	label: ReactNode
	value: string
}

type SegmentState = 'active' | 'activeDisabled'

function Segment({
	disabled,
	icon = 'cafe-outline',
	label,
	value,
}: SegmentProps) {
	const { onChange, value: selectedValue } = useSegmentedControl()
	const selected = selectedValue === value

	const state: SegmentState | undefined = selected
		? disabled
			? 'activeDisabled'
			: 'active'
		: undefined

	styles.useVariants({ state })

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ selected }}
			onPress={() => onChange(value)}
			style={styles.segment}
		>
			<TextColorIcon name={icon} size={20} />
			<Text style={styles.segmentText}>{label}</Text>
		</Pressable>
	)
}

Segment.displayName = 'SegmentedControl.Segment'

function SegmentedControl<T extends string>({
	children,
	onChange,
	value,
}: SegmentedControlProps<T>) {
	const childArray = Children.toArray(children).filter(
		(child): child is ReactElement<SegmentProps> =>
			isValidElement(child) &&
			(child.type as { displayName?: string }).displayName ===
				'SegmentedControl.Segment',
	)

	return (
		<SegmentedControlContext.Provider
			value={{ onChange: onChange as (value: string) => void, value }}
		>
			<View style={styles.container}>
				{childArray.map((child) =>
					cloneElement(child, {
						key: child.props.value,
					}),
				)}
			</View>
		</SegmentedControlContext.Provider>
	)
}

function useSegmentedControl() {
	const context = useContext(SegmentedControlContext)
	if (!context) {
		throw new Error('Segment must be used within a SegmentedControl')
	}
	return context
}

SegmentedControl.Segment = Segment

export default SegmentedControl

const styles = StyleSheet.create((theme) => ({
	container: {
		backgroundColor: theme.colors.gray.background,
		borderCurve: 'continuous',
		borderRadius: theme.borderRadius.lg,
		flexDirection: 'row',
		padding: theme.spacing.xs,
	},
	segment: {
		alignItems: 'center',
		backgroundColor: theme.colors.gray.background,
		borderCurve: 'continuous',
		borderRadius: theme.borderRadius.lg - theme.spacing.xs,
		flex: 1,
		flexDirection: 'row',
		gap: theme.spacing.sm,
		justifyContent: 'center',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		variants: {
			state: {
				active: {
					backgroundColor: theme.colors.gray.border,
				},
				activeDisabled: {
					backgroundColor: theme.colors.gray.interactive,
				},
			},
		},
	},
	segmentText: {
		color: theme.colors.gray.text,
		fontSize: theme.fontSizes.sm,
		fontWeight: '600',
	},
}))
