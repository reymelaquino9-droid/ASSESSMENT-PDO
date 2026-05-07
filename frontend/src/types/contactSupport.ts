export type ContactSupportFormData = {
  name: string
  email: string
  message: string
}

export type ContactSupportFieldErrors = Partial<Record<keyof ContactSupportFormData, string>>

export type ContactSupportStatus = 'idle' | 'sending' | 'success' | 'error'

export type ContactSupportResponse = {
  code?: string
  success: boolean
  message?: string
  emailResults?: { recipient: string; success: boolean; error?: string; recipientNotFound?: boolean }[]
}

export const initialContactSupportForm: ContactSupportFormData = {
  name: '',
  email: '',
  message: '',
}
