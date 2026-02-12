import { z } from 'zod/v4'

export const PhoneSchema = z
	.string()
	.trim()
	.transform((s) => (s.startsWith('+') ? s : `+${s}`))
	.refine((value) => /^\+\d{7,15}$/.test(value), {
		message: 'Invalid phone number format',
	})

export type Phone = z.infer<typeof PhoneSchema>

export const RequestOtpSchema = z.strictObject({
	birthdate: z.string().max(10, 'errors.max-length').optional(),
	email: z.email('errors.invalid-email').optional(),
	name: z.string().max(100, 'errors.max-length').optional(),
	phone: PhoneSchema,
})

export type RequestOtp = z.infer<typeof RequestOtpSchema>

export const VerifyOtpSchema = z.strictObject({
	code: z.string().length(6, 'errors.length'),
	phone: PhoneSchema,
	sessionName: z.string().min(1),
})

export type VerifyOtp = z.infer<typeof VerifyOtpSchema>

export const CreateOrderProductSchema = z.strictObject({
	count: z.int().positive().max(10, 'errors.max-count'),
	modification: z
		.array(
			z.strictObject({
				a: z.int().positive().max(10, 'errors.max-count').default(1),
				m: z.string().min(1, 'errors.required'),
			}),
		)
		.optional(),
	modificator_id: z.string().optional(),
	product_id: z.string().min(1, 'errors.required'),
})

export const CreateOrderSchema = z
	.strictObject({
		client_id: z.int().positive(),
		comment: z.string().max(2000, 'errors.max-length'),
		guests_count: z.int().positive().max(99, 'errors.max-count').optional(),
		payment: z.strictObject({
			amount: z.int().positive().min(100),
		}),
		products: z.array(CreateOrderProductSchema).min(1, 'errors.min-count'),
		serviceMode: z.int().positive().max(3, 'errors.invalid'),
		table_id: z.string().nullable().optional(),
		transaction_id: z.string().optional(),
	})
	.refine(
		(data) => {
			// Take-in orders (serviceMode 1) require a table_id
			if (data.serviceMode === 1) {
				return (
					data.table_id !== null &&
					data.table_id !== undefined &&
					data.table_id.length > 0
				)
			}
			return true
		},
		{
			message: 'Take-in orders require a table assignment',
			path: ['table_id'],
		},
	)

export type CreateOrder = z.infer<typeof CreateOrderSchema>

export const CreateEWallettransactionSchema = z.strictObject({
	amount: z.int().positive(),
})

export type CreateEWalletTransaction = z.infer<
	typeof CreateEWallettransactionSchema
>

export const CreateStripeTransactionSchema = z.strictObject({
	amount: z.int().positive(),
})

export type CreateStripeTransaction = z.infer<
	typeof CreateStripeTransactionSchema
>

export const CreateTableTransactionSchema = z.strictObject({
	guests_count: z.int().positive().max(99, 'errors.max-count'),
	table_id: z.string().min(1, 'errors.required'),
})

export type CreateTableTransaction = z.infer<
	typeof CreateTableTransactionSchema
>

export const AddTransactionProductsSchema = z.strictObject({
	products: z.array(CreateOrderProductSchema).min(1, 'errors.min-count'),
})

export type AddTransactionProducts = z.infer<
	typeof AddTransactionProductsSchema
>
