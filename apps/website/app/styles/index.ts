/**
 * Styles Entry Point
 *
 * Re-exports all design tokens, global patterns, and theme utilities for easy access.
 * Theme is automatically adaptive based on system preference (prefers-color-scheme).
 *
 * Usage:
 *   import { vars, buttonPrimary, card } from '~/styles';
 */

export { vars } from './tokens.css'
export {
	buttonBase,
	buttonPrimary,
	buttonSecondary,
	buttonOutline,
	buttonGhost,
	buttonLight,
	card,
	cardCompact,
	cardHover,
	section,
	sectionCompact,
	container,
	containerWide,
	containerNarrow,
	textLarge,
	textCenter,
	textCentered,
	grid2,
	grid3,
	flexRow,
	flexColumn,
	imagePlaceholder,
} from './global.css'
