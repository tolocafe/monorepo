import { useCallback } from 'react'

export function registerForPushNotificationsAsync() {
	return null
}

/**
 * Request tracking transparency permission (iOS 14+ only)
 * This should be called after successful sign-in to request permission for tracking
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function requestTrackingPermissionAsync() {
	return true
}

export function useRegisterForPushNotifications() {
	return useCallback(() => null, [])
}
