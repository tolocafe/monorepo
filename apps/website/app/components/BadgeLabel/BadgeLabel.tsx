import { Trans } from '@lingui/react/macro'

export function BadgeLabel({
	badge,
}: {
	badge: 'bestseller' | 'limited' | 'new' | 'sale'
}) {
	switch (badge) {
		case 'bestseller': {
			return <Trans>Bestseller</Trans>
		}
		case 'limited': {
			return <Trans>Limited</Trans>
		}
		case 'new': {
			return <Trans>New</Trans>
		}
		case 'sale': {
			return <Trans>Sale</Trans>
		}
		default: {
			return badge satisfies never
		}
	}
}
