export type ContactSupportFormData = {
  name: string
  email: string
  message: string
}

export type ContactSupportFieldName = keyof ContactSupportFormData | 'verificationCode'

export type ContactSupportFieldErrors = Partial<Record<ContactSupportFieldName, string>>

export type ContactSupportStatus = 'idle' | 'sending' | 'success' | 'error'

export type EmailVerificationStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'

export type ContactSupportResponse = {
  code?: string
  success: boolean
  message?: string
  alreadyVerified?: boolean
  codeAlreadySent?: boolean
  codeExpiresAt?: string
  emailResults?: { recipient: string; success: boolean; error?: string; recipientNotFound?: boolean }[]
}

export const initialContactSupportForm: ContactSupportFormData = {
  name: '',
  email: '',
  message: '',
}
