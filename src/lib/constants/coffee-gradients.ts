/**
 * Gradient color palettes for coffee-related UI components.
 * Used in CoffeeStoryBubble and coffee stories screen.
 */
export const COFFEE_GRADIENT_COLORS = [
	['#8B4513', '#D2691E'], // Brown/Tan
	['#4A2511', '#6F4E37'], // Dark Brown
	['#654321', '#8B6914'], // Coffee Brown to Gold
	['#3E2723', '#5D4037'], // Dark Coffee
	['#3C1A1A', '#6D3838'], // Reddish Brown
] as const

/**
 * Extended gradient colors for full-screen coffee stories.
 */
export const COFFEE_STORY_GRADIENT_COLORS = [
	['#A0522D', '#D2691E', '#F4A460'], // Burnt Sienna to Sandy Brown (Caramel)
	['#8B2500', '#B8410B', '#D2691E'], // Dark Cherry to Burnt Orange (Cherry)
	['#6B4423', '#8B6914', '#DAA520'], // Coffee to Goldenrod (Honey/Golden)
	['#B8610B', '#D87020', '#F4A460'], // Burnt Orange to Peach (Peach/Apricot)
	['#704214', '#A0522D', '#CD853F'], // Rich Brown to Peru (Chocolate/Walnut)
] as const

/**
 * Get a gradient color index based on coffee name hash.
 * Ensures consistent gradient assignment for the same coffee.
 */
export function getCoffeeGradientIndex(
	coffeeName: string,
	maxIndex = 5,
): number {
	return (
		coffeeName
			// eslint-disable-next-line unicorn/prefer-spread
			.split('')
			// eslint-disable-next-line unicorn/prefer-code-point
			.reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0) %
		maxIndex
	)
}
