import { useEffect, useState } from 'react'

const BASE_URL = 'https://app.tolo.cafe/api/pos'

type ClientData = {
	client: {
		date_activale: string
		firstname: string
		lastname: string
		total_payed_sum: number
	}
	summary: string
	transactions: unknown[]
}

export default function ClientScreen({ clientId }: { clientId: string }) {
	const [dataState, setDataState] = useState({
		data: null as ClientData | null,
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
						data: JSON.parse(response.result) as ClientData,
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
			<h1>
				{dataState.data.client.firstname} {dataState.data.client.lastname}
			</h1>

			<h2>General</h2>
			<label>
				<b>Descripción</b>
				<span>{dataState.data.summary}</span>
			</label>

			<h2>Finanzas</h2>
			<label>
				<b>Total pagado</b>
				<span>{dataState.data.client.total_payed_sum}</span>
			</label>
			<label>
				<b>Transacciones totales</b>
				<span>{dataState.data.transactions.length}</span>
			</label>
			<label>
				<b>Registro desde</b>
				<span>{dataState.data.client.date_activale}</span>
			</label>
		</div>
	)
}
