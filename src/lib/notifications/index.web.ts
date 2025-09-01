import { useCallback } from 'react'

export function registerForPushNotificationsAsync() {
	return null
}

/**
 * Request tracking transparency permission (iOS 14+ only)
 * This should be called after successful sign-in to request permission for tracking
 */
export function requestTrackingPermissionAsync() {
	return Promise.resolve(true)
}

export function useRegisterForPushNotifications() {
	return useCallback(() => null, [])
}
