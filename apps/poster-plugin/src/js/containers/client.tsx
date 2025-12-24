import { useEffect, useState } from 'react'

import type { PosClientData } from '~common/api'

const BASE_URL = 'https://app.tolo.cafe/api/pos'

export default function ClientScreen({ clientId }: { clientId: string }) {
	const [dataState, setDataState] = useState({
		data: null as null | PosClientData,
		error: null as Error | null | string,
		loading: true,
	})

	useEffect(() => {
		if (!clientId) return
		const url = `${BASE_URL}/clients/${clientId}`

		void Poster.makeRequest(
			url,
			{
				headers: ['Content-Type: application/json'],
				method: 'get',
				timeout: 10_000,
			},
			(response: { result: string }) => {
				try {
					setDataState({
						data: JSON.parse(response.result) as PosClientData,
						error: null,
						loading: false,
					})
				} catch (error) {
					setDataState({
						data: null,
						error: error instanceof Error ? error.message : 'Unknown error',
						loading: false,
					})
				}
			},
		)
	}, [clientId])

	if (!dataState.data) {
		if (dataState.loading) {
			return (
				<div>
					<h1>Cargando cliente...</h1>
				</div>
			)
		}

		return (
			<div>
				<h1>Error</h1>
			</div>
		)
	}

	return (
		<div>
			<h1>{dataState.data.client.name}</h1>

			<h2>General</h2>
			<label>
				<b>Descripción</b>
				<span>{dataState.data.summary}</span>
			</label>

			<h2>Programa de lealtad</h2>
			<label>
				<b>Sellos</b>
				<span>{dataState.data.client.stamps}</span>
			</label>
			<label>
				<b>Bebida de cumpleaños</b>
				<span>
					{dataState.data.client.canRedeemBirthday
						? '✓ Disponible'
						: '✗ No disponible'}
				</span>
			</label>

			<h2>Finanzas</h2>
			<label>
				<b>Total pagado</b>
				<span>{dataState.data.client.totalPayedSum}</span>
			</label>
			<label>
				<b>Transacciones totales</b>
				<span>{dataState.data.transactions.length}</span>
			</label>
			<label>
				<b>Registro desde</b>
				<span>{dataState.data.client.registrationDate}</span>
			</label>
		</div>
	)
}
