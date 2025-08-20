import { Platform } from 'react-native'

import * as TrackingTransparency from 'expo-tracking-transparency'

/**
 * Service for managing App Tracking Transparency permissions on iOS
 */
class TrackingTransparencyService {
	/**
	 * Get current tracking permission status without requesting
	 */
	async getTrackingPermissionStatus(): Promise<{
		canAskAgain: boolean
		granted: boolean
		status: TrackingTransparency.PermissionStatus
	}> {
		// Always return granted on non-iOS platforms
		if (Platform.OS !== 'ios') {
			return {
				canAskAgain: false,
				granted: true,
				status: TrackingTransparency.PermissionStatus.GRANTED,
			}
		}

		try {
			const { status } =
				await TrackingTransparency.getTrackingPermissionsAsync()

			return {
				canAskAgain:
					status === TrackingTransparency.PermissionStatus.UNDETERMINED,
				granted: status === TrackingTransparency.PermissionStatus.GRANTED,
				status,
			}
		} catch (error) {
			console.error('Failed to get tracking permission status:', error)

			// Return denied status on error
			return {
				canAskAgain: false,
				granted: false,
				status: TrackingTransparency.PermissionStatus.DENIED,
			}
		}
	}

	/**
	 * Request tracking permission from the user
	 * Only works on iOS 14+ and returns granted status on other platforms
	 */
	async requestTrackingPermission(): Promise<{
		canAskAgain: boolean
		granted: boolean
		status: TrackingTransparency.PermissionStatus
	}> {
		// Only request permission on iOS
		if (Platform.OS !== 'ios') {
			return {
				canAskAgain: false,
				granted: true,
				status: TrackingTransparency.PermissionStatus.GRANTED,
			}
		}

		try {
			const { status } =
				await TrackingTransparency.requestTrackingPermissionsAsync()

			return {
				canAskAgain:
					status === TrackingTransparency.PermissionStatus.UNDETERMINED,
				granted: status === TrackingTransparency.PermissionStatus.GRANTED,
				status,
			}
		} catch (error) {
			console.error('Failed to request tracking permission:', error)

			// Return denied status on error
			return {
				canAskAgain: false,
				granted: false,
				status: TrackingTransparency.PermissionStatus.DENIED,
			}
		}
	}

	/**
	 * Check if we should request tracking permission
	 * Returns true if permission is undetermined and platform is iOS
	 */
	async shouldRequestPermission(): Promise<boolean> {
		if (Platform.OS !== 'ios') {
			return false
		}

		const { status } = await this.getTrackingPermissionStatus()
		return status === TrackingTransparency.PermissionStatus.UNDETERMINED
	}
}

export const trackingTransparencyService = new TrackingTransparencyService()
