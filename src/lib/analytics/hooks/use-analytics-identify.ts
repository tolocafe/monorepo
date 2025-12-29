import { useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'

import { identify } from '@/lib/analytics'
import { requestTrackingPermissionAsync } from '@/lib/notifications'
import { selfQueryOptions } from '@/lib/queries/auth'

export function useAnalyticsIdentify() {
	const { data: selfData } = useQuery({
		...selfQueryOptions,
		staleTime: Number.POSITIVE_INFINITY,
	})

	useEffect(() => {
		if (!selfData) return

		async function requestIdentify() {
			const granted = await requestTrackingPermissionAsync()

			if (!granted) return

			void identify({
				email: selfData?.email,
				firstName: selfData?.firstname,
				lastName: selfData?.lastname,
				phoneNumber: selfData?.phone_number,
				userId: selfData?.client_id,
			})
		}

		void requestIdentify()
	}, [selfData])
}
