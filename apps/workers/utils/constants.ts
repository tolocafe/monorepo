const TEST_PHONE_NUMBERS = process.env.TEST_PHONE_NUMBERS as string | undefined

export const testPhoneNumbers: string[] = (TEST_PHONE_NUMBERS ?? '').split(',')

/**
 * Client group IDs for team members with elevated access
 * - 8 = Owners
 * - 9 = Team members (baristas)
 */
export const TEAM_GROUP_IDS = new Set(['8', '9'])
