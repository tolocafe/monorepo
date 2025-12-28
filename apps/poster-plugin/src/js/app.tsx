import { useEffect, useMemo, useState } from 'react'

import ClientScreen from './containers/client'
import SelectClientScreen from './containers/select-client'

import '../css/reset.scss'
import '../css/main.scss'

const initialState = {
	clientId: null as null | string,
	currentAction: null as 'order' | 'payment' | null,
}

export default function App() {
	const [state, setState] = useState(initialState)

	useEffect(() => {
		Poster.interface.showApplicationIconAt({
			order: '✅ Escanear tarjeta',
			payment: '👀 Ver cliente',
		})

		Poster.on('applicationIconClicked', ({ order, place }) => {
			setState({ clientId: order.userId ?? null, currentAction: place })

			if (place === 'order') {
				void Poster.interface.scanBarcode().then(({ barcode }) => {
					const customerId = Number(barcode.replace('TOLO-', ''))
					void Poster.orders.setOrderClient(order.id, customerId)

					Poster.interface.popup({
						height: 500,
						title: 'Información',
						width: 600,
					})
				})
			}

			if (place === 'payment') {
				Poster.interface.popup({
					height: 500,
					title: 'Visitas',
					width: 600,
				})
			}
		})

		Poster.on('afterPopupClosed', () => {
			setState(initialState)
		})

		Poster.on('orderClientChange', (data: { clientId: string }) => {
			if (data.clientId) {
				setState({ clientId: data.clientId, currentAction: 'order' })

				Poster.interface.popup({
					height: 500,
					title: 'Información',
					width: 600,
				})
			}
		})
	}, [])

	const renderContent = useMemo(() => {
		if (!state.clientId) {
			return <SelectClientScreen />
		}

		if (state.currentAction === 'order' || state.currentAction === 'payment') {
			return <ClientScreen clientId={state.clientId} />
		}

		return null
	}, [state.clientId, state.currentAction])

	return <main>{renderContent}</main>
}
