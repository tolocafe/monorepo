# BlockText Component

Platform-specific Portable Text rendering for React Native and Web.

## Installation

The required packages are already installed:

- `@portabletext/react` - For web rendering
- `@portabletext/react-native` - For React Native rendering
- `@portabletext/types` - For TypeScript types

## Usage

### Basic Example

```tsx
import { BlockText } from '@/components/BlockText'

function MyComponent() {
	const content = [
		{
			_type: 'block',
			children: [
				{
					_type: 'span',
					text: 'This is a paragraph with ',
				},
				{
					_type: 'span',
					marks: ['strong'],
					text: 'bold text',
				},
				{
					_type: 'span',
					text: ' and ',
				},
				{
					_type: 'span',
					marks: ['em'],
					text: 'italic text',
				},
			],
			markDefs: [],
			style: 'normal',
		},
	]

	return <BlockText value={content} />
}
```

### With Headings

```tsx
const content = [
	{
		_type: 'block',
		children: [{ _type: 'span', text: 'Main Title' }],
		markDefs: [],
		style: 'h1',
	},
	{
		_type: 'block',
		children: [{ _type: 'span', text: 'Subtitle' }],
		markDefs: [],
		style: 'h2',
	},
	{
		_type: 'block',
		children: [{ _type: 'span', text: 'Regular paragraph text' }],
		markDefs: [],
		style: 'normal',
	},
]
```

### With Lists

```tsx
const content = [
	{
		_type: 'block',
		children: [{ _type: 'span', text: 'First item' }],
		level: 1,
		listItem: 'bullet',
		markDefs: [],
		style: 'normal',
	},
	{
		_type: 'block',
		children: [{ _type: 'span', text: 'Second item' }],
		level: 1,
		listItem: 'bullet',
		markDefs: [],
		style: 'normal',
	},
]
```

## TypeScript Support

```tsx
import type { BlockTextContent } from '@/components/BlockText'

interface MyData {
	description: BlockTextContent
}
```

## Sanity Schema Example

To use Portable Text in your Sanity schema:

```typescript
{
  name: 'description',
  type: 'array',
  title: 'Description',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
        ],
      },
    },
  ],
}
```

## Styling

The component uses Unistyles for consistent theming across platforms. Customize by modifying the `styles` object in the component files.

## Platform Differences

- **React Native** (`index.tsx`): Uses custom Text components from `@/components/Text`
- **Web** (`index.web.tsx`): Uses semantic HTML elements (h1, h2, p, ul, ol, li, etc.)

Both implementations maintain visual consistency through shared theme values.

## Supported Marks

- `strong` - Bold text
- `em` - Italic text

## Supported Block Styles

- `normal` - Regular paragraph
- `h1` - Heading 1
- `h2` - Heading 2
- `h3` - Heading 3
- `h4` - Heading 4

## Supported List Types

- `bullet` - Unordered list
- `number` - Ordered list

## API

### BlockTextProps

| Prop    | Type                            | Required | Description                       |
| ------- | ------------------------------- | -------- | --------------------------------- |
| `value` | `BlockTextContent \| undefined` | Yes      | Portable Text content to render   |
| `style` | `object`                        | No       | Optional style for container view |

## References

- [Portable Text React (Web)](https://github.com/portabletext/react-portabletext)
- [Portable Text React Native](https://github.com/portabletext/react-native-portabletext)
- [Portable Text Specification](https://github.com/portabletext/portabletext)
