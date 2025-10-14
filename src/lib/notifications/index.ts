import { useCallback } from 'react'
import { Platform } from 'react-native'

import { useMutation, useQuery } from '@tanstack/react-query'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import * as TrackingTransparency from 'expo-tracking-transparency'

import {
	selfQueryOptions,
	updateClientPushTokensMutationOptions,
} from '@/lib/queries/auth'

export async function registerForPushNotificationsAsync() {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('default', {
			importance: Notifications.AndroidImportance.DEFAULT,
			name: 'default',
		})
	}

	if (Device.isDevice) {
		const { status: existingStatus } = await Notifications.getPermissionsAsync()

		let finalStatus = existingStatus
		if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
			const { status } = await Notifications.requestPermissionsAsync()
			finalStatus = status
		}

		if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
			// handleRegistrationError(
			// 	'Permission not granted to get push token for push notification!',
			// )
			return null
		}

		const projectId =
			(Constants.expoConfig?.extra?.eas as undefined | { projectId?: string })
				?.projectId ?? Constants.easConfig?.projectId

		if (!projectId) {
			// handleRegistrationError('Project ID not found')
			return null
		}

		try {
			const { data: pushTokenString } =
				await Notifications.getExpoPushTokenAsync({ projectId })

			return pushTokenString
		} catch {
			// handleRegistrationError('Failed to get push token')
			return null
		}
	} else {
		// handleRegistrationError('Must use physical device for push notifications')
		return null
	}
}

/**
 * Request tracking transparency permission (iOS 14+ only)
 * This should be called after successful sign-in to request permission for tracking
 */
export async function requestTrackingPermissionAsync(): Promise<boolean> {
	try {
		// Check if tracking transparency is available (iOS 14+ only)
		if (!TrackingTransparency.isAvailable()) {
			return true // Consider as granted for non-iOS platforms
		}

		const { status } =
			await TrackingTransparency.requestTrackingPermissionsAsync()

		return status === TrackingTransparency.PermissionStatus.GRANTED
	} catch {
		return false
	}
}

export async function resetBadgeCount() {
	try {
		await Notifications.setBadgeCountAsync(0)
	} catch {
		// Silently fail if badge count reset is not supported
	}
}

export function useRegisterForPushNotifications() {
	const { data: user } = useQuery(selfQueryOptions)
	const { mutate } = useMutation(
		updateClientPushTokensMutationOptions(user?.client_id as string),
	)

	return useCallback(async () => {
		if (!user?.client_id) return

		const token = await registerForPushNotificationsAsync()

		if (!token) {
			return
		}

		mutate(token)
	}, [mutate, user?.client_id])
}
