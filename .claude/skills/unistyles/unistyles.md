---
description: React Native Unistyles 3.0 styling - themes, breakpoints, mini runtime, dynamic functions, and variants
user-invocable: true
---

# React Native Unistyles 3.0

Use this skill when styling React Native components with Unistyles. This covers configuration, StyleSheet API, theming, breakpoints, mini runtime, and dynamic functions.

## Key Principles

- **No inline styles** - Always use `StyleSheet.create()` from `react-native-unistyles`
- **No SafeAreaView** - Use `rt.insets` from mini runtime instead
- **No React Native StyleSheet** - Import `StyleSheet` from `react-native-unistyles`
- **No re-renders** - Unistyles updates styles via C++ without component re-renders

## Configuration

Configuration must be called before any `StyleSheet.create()` calls. Place in your app's entry point.

```tsx
import { StyleSheet } from 'react-native-unistyles'

// Define themes
const lightTheme = {
	colors: {
		primary: '#ff1ff4',
		background: '#ffffff',
	},
	space: {
		xs: 2,
		s: 4,
		m: 8,
		l: 16,
		xl: 24,
	},
}

const darkTheme = {
	colors: {
		primary: '#ff1ff4',
		background: '#000000',
	},
	space: {
		xs: 2,
		s: 4,
		m: 8,
		l: 16,
		xl: 24,
	},
}

// Define breakpoints (one must be 0)
const breakpoints = {
	xs: 0,
	sm: 576,
	md: 768,
	lg: 992,
	xl: 1200,
}

// Configure Unistyles
StyleSheet.configure({
	themes: {
		light: lightTheme,
		dark: darkTheme,
	},
	breakpoints,
	settings: {
		adaptiveThemes: true, // Auto-switch based on device color scheme
		// OR use initialTheme (mutually exclusive with adaptiveThemes):
		// initialTheme: 'light',
		// initialTheme: () => storage.getString('theme') ?? 'light',
	},
})

// TypeScript type augmentation
type AppThemes = {
	light: typeof lightTheme
	dark: typeof darkTheme
}
type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
	export interface UnistylesThemes extends AppThemes {}
	export interface UnistylesBreakpoints extends AppBreakpoints {}
}
```

## StyleSheet API

### Static StyleSheet

```tsx
import { StyleSheet } from 'react-native-unistyles'

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'red',
	},
})
```

### Themable StyleSheet

Access theme via first parameter:

```tsx
const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		padding: theme.space.m,
	},
}))
```

### Themable with Mini Runtime

Access both theme and runtime values:

```tsx
const styles = StyleSheet.create((theme, rt) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingTop: rt.insets.top,
		paddingBottom: rt.insets.bottom,
	},
}))
```

### Static Values

```tsx
// Thinnest possible border
borderBottomWidth: StyleSheet.hairlineWidth

// Absolute positioning
...StyleSheet.absoluteFillObject
// Same as: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }
```

## Mini Runtime (rt)

The mini runtime provides platform-specific values. Use instead of `react-native-safe-area-context`.

```tsx
const styles = StyleSheet.create((theme, rt) => ({
	container: {
		// Safe area insets
		paddingTop: rt.insets.top,
		paddingBottom: rt.insets.bottom,
		paddingLeft: rt.insets.left,
		paddingRight: rt.insets.right,

		// Screen dimensions
		width: rt.screen.width,
		height: rt.screen.height,

		// Font scaling
		fontSize: rt.fontScale * 16,

		// Orientation
		flexDirection: rt.isPortrait ? 'column' : 'row',
	},
}))
```

### Available Properties

| Property                  | Type    | Description                       |
| ------------------------- | ------- | --------------------------------- |
| `rt.insets.top`           | number  | Top safe area inset               |
| `rt.insets.bottom`        | number  | Bottom safe area inset            |
| `rt.insets.left`          | number  | Left safe area inset              |
| `rt.insets.right`         | number  | Right safe area inset             |
| `rt.insets.ime`           | number  | Keyboard (IME) inset              |
| `rt.screen.width`         | number  | Screen width                      |
| `rt.screen.height`        | number  | Screen height                     |
| `rt.pixelRatio`           | number  | Device pixel ratio                |
| `rt.fontScale`            | number  | System font scale                 |
| `rt.rtl`                  | boolean | Right-to-left layout              |
| `rt.isPortrait`           | boolean | Portrait orientation              |
| `rt.isLandscape`          | boolean | Landscape orientation             |
| `rt.statusBar.height`     | number  | Status bar height                 |
| `rt.navigationBar.height` | number  | Navigation bar height             |
| `rt.themeName`            | string  | Current theme name                |
| `rt.breakpoint`           | string  | Current breakpoint                |
| `rt.colorScheme`          | string  | 'light', 'dark', or 'unspecified' |

## Breakpoints

Define responsive styles with breakpoint objects. Values cascade from smallest to largest.

```tsx
const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		// Different background per breakpoint
		backgroundColor: {
			xs: theme.colors.background, // 0px+
			sm: theme.colors.primary, // 576px+
			md: theme.colors.secondary, // 768px+
		},
		// Different padding per breakpoint
		padding: {
			xs: theme.space.s,
			md: theme.space.l,
		},
	},
}))
```

### Built-in Orientation Breakpoints

```tsx
const styles = StyleSheet.create((theme) => ({
	container: {
		flexDirection: {
			portrait: 'column',
			landscape: 'row',
		},
	},
}))
```

## Media Queries (mq)

For pixel-perfect control beyond breakpoints:

```tsx
import { StyleSheet, mq } from 'react-native-unistyles'

const styles = StyleSheet.create((theme) => ({
	container: {
		backgroundColor: {
			// Width range: 240px to 379px
			[mq.only.width(240, 380)]: theme.colors.background,
			// Width 380px and above
			[mq.only.width(380)]: theme.colors.primary,
		},
	},
}))
```

### mq Patterns

```tsx
// Width only
;[mq.only.width(100, 200)][mq.only.width(500)][mq.only.width(null, 800)][ // 100px to 199px // 500px and above // 0px to 799px
	// Height only
	mq.only.height(300, 500)
][ // 300px to 499px height
	// Combined
	mq.width(240, 380).and.height(300)
][ // Width AND height conditions
	// Using breakpoints
	mq.only.width('sm', 'md')
][mq.only.width(200, 'xl')] // From sm to md breakpoint // From 200px to xl breakpoint
```

### Display/Hide Components

```tsx
import { Display, Hide, mq } from 'react-native-unistyles'

// Show only on small screens
<Display mq={mq.only.width(0, 400)}>
  <Text>Mobile only</Text>
</Display>

// Hide on large screens
<Hide mq={mq.only.width(800)}>
  <Text>Hidden on desktop</Text>
</Hide>
```

## Dynamic Functions

Pass values from JSX to stylesheets:

```tsx
const styles = StyleSheet.create((theme) => ({
	container: (maxWidth: number, highlighted: boolean) => ({
		flex: 1,
		maxWidth,
		backgroundColor: highlighted
			? theme.colors.primary
			: theme.colors.background,
	}),
}))

function Component({ maxWidth, highlighted }) {
	return (
		<View style={styles.container(maxWidth, highlighted)}>{/* content */}</View>
	)
}
```

**Note:** Arguments must be serializable (strings, numbers, booleans, arrays, plain objects).

## Variants

Define conditional styling patterns:

```tsx
const styles = StyleSheet.create((theme) => ({
	button: {
		padding: theme.space.m,
		borderRadius: 8,
		variants: {
			size: {
				small: { width: 100, height: 40 },
				medium: { width: 150, height: 48 },
				large: { width: 200, height: 56 },
			},
			variant: {
				primary: { backgroundColor: theme.colors.primary },
				secondary: { backgroundColor: theme.colors.secondary },
				default: { backgroundColor: theme.colors.background },
			},
		},
	},
}))

function Button({ size = 'medium', variant = 'primary' }) {
	styles.useVariants({ size, variant })

	return <Pressable style={styles.button}>{/* content */}</Pressable>
}
```

### Compound Variants

Apply styles when multiple variant conditions match:

```tsx
const styles = StyleSheet.create((theme) => ({
	button: {
		variants: {
			size: {
				small: { padding: 8 },
				large: { padding: 16 },
			},
			disabled: {
				true: { opacity: 0.5 },
				false: { opacity: 1 },
			},
		},
		compoundVariants: [
			{
				size: 'large',
				disabled: true,
				styles: {
					backgroundColor: theme.colors.muted,
				},
			},
		],
	},
}))
```

## useUnistyles Hook

Access theme values in components (causes re-renders):

```tsx
import { useUnistyles } from 'react-native-unistyles'

function Component() {
	const { theme } = useUnistyles()

	return (
		<Pressable
			style={({ pressed }) => ({
				backgroundColor: pressed
					? theme.colors.primary
					: theme.colors.background,
			})}
		/>
	)
}
```

**Prefer StyleSheet.create** over `useUnistyles` when possible to avoid re-renders.

## UnistylesRuntime

Access runtime values and control functions outside StyleSheets:

```tsx
import { UnistylesRuntime } from 'react-native-unistyles'

// Read values
UnistylesRuntime.screen.width
UnistylesRuntime.screen.height
UnistylesRuntime.insets.top
UnistylesRuntime.themeName
UnistylesRuntime.breakpoint
UnistylesRuntime.colorScheme
UnistylesRuntime.hasAdaptiveThemes

// Change theme (not available with adaptiveThemes)
UnistylesRuntime.setTheme('dark')

// Update theme at runtime
UnistylesRuntime.updateTheme('dark', (current) => ({
	...current,
	colors: {
		...current.colors,
		primary: '#newcolor',
	},
}))

// Toggle adaptive themes
UnistylesRuntime.setAdaptiveThemes(true)

// Set root view background
UnistylesRuntime.setRootViewBackgroundColor('#000000')
```

## Third-Party Components

### Standard style prop

Works automatically:

```tsx
<ThirdPartyComponent style={styles.container} />
```

### contentContainerStyle

Use `withUnistyles` factory:

```tsx
import { withUnistyles } from 'react-native-unistyles'

const StyledScrollView = withUnistyles(ScrollView, (theme) => ({
	contentContainerStyle: {
		padding: theme.space.m,
	},
}))
```

### Last resort: useUnistyles

```tsx
const { theme } = useUnistyles()

<ThirdPartyComponent
  customProp={{ color: theme.colors.primary }}
/>
```

## Common Patterns

### Safe Area Container

```tsx
const styles = StyleSheet.create((theme, rt) => ({
	safeArea: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingTop: rt.insets.top,
		paddingBottom: rt.insets.bottom,
		paddingLeft: rt.insets.left,
		paddingRight: rt.insets.right,
	},
}))
```

### Keyboard-Avoiding Container

```tsx
const styles = StyleSheet.create((theme, rt) => ({
	container: {
		flex: 1,
		paddingBottom: rt.insets.ime || rt.insets.bottom,
	},
}))
```

### Responsive Grid

```tsx
const styles = StyleSheet.create((theme) => ({
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	gridItem: {
		width: {
			xs: '100%',
			sm: '50%',
			md: '33.33%',
			lg: '25%',
		},
		padding: theme.space.m,
	},
}))
```

## Prerequisites

- React Native 0.78.0+
- New Architecture enabled
- Expo SDK 53+ (if using Expo)

## Installation

```bash
bun add react-native-unistyles react-native-nitro-modules react-native-edge-to-edge
```

### Babel Configuration

```js
// babel.config.js
module.exports = function (api) {
	return {
		plugins: [
			[
				'react-native-unistyles/plugin',
				{
					root: 'src',
				},
			],
		],
	}
}
```
