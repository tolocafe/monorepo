import type { PortableTextBlock } from '@portabletext/types'

/**
 * Block text content type for Sanity Portable Text
 */
export type BlockTextContent = PortableTextBlock[]

/**
 * Props for the BlockText component
 */
export type BlockTextProps = {
	/**
	 * Optional style to apply to the container
	 */
	style?: object
	/**
	 * Portable Text content to render
	 */
	value: BlockTextContent | undefined
}
