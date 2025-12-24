/**
 * Client group IDs for team members with elevated access
 * - 8 = Owners
 * - 9 = Team members (baristas)
 */
export const TEAM_GROUP_IDS = new Set(['8', '9'])

export function parseTestPhoneNumbers(testPhoneNumbersEnv?: string): string[] {
	return (testPhoneNumbersEnv ?? '').split(',').filter(Boolean)
}
