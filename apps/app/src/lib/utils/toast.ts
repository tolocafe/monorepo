import * as Burnt from 'burnt'

type ToastOptions = {
	message: string
	title: string
}

export function showSuccessToast({ message, title }: ToastOptions) {
	Burnt.toast({
		duration: 2,
		haptic: 'success',
		message,
		preset: 'done',
		title,
	})
}

export function showErrorToast({ message, title }: ToastOptions) {
	Burnt.toast({
		duration: 3,
		haptic: 'error',
		message,
		preset: 'error',
		title,
	})
}
