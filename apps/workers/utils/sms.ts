/**
 * Twilio SMS Client
 *
 * Sends SMS messages via the Twilio REST API.
 * Used for OTP verification and broadcast notifications.
 *
 * @see https://www.twilio.com/docs/messaging/api/message-resource#create-a-message-resource
 */

type TwilioEnv = {
	TWILIO_ACCOUNT_SID: string
	TWILIO_AUTH_TOKEN: string
	TWILIO_FROM_NUMBER: string
}

export function sendSms(
	env: TwilioEnv,
	/** International format, e.g. "+1234567890" */
	phone: string,
	message: string,
) {
	const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = env

	return fetch(
		`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
		{
			body: new URLSearchParams({
				Body: message,
				From: TWILIO_FROM_NUMBER,
				To: phone,
			}),
			headers: {
				Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			method: 'POST',
		},
	)
}
