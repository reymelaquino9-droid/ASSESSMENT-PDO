import type { ContactSupportFormData, ContactSupportResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const createApiUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}${path}`

export class ApiError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export const sendContactSupportMessage = async (form: ContactSupportFormData) => {
  const response = await fetch(createApiUrl('/contact-support'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(form),
  })

  const result = (await response.json()) as ContactSupportResponse

  if (!response.ok) {
    throw new ApiError(result.message || 'Unable to send support message.', result.code)
  }

  return result
}

export const requestContactSupportVerificationCode = async (email: string) => {
  const response = await fetch(createApiUrl('/contact-support/verification-code'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  const result = (await response.json()) as ContactSupportResponse

  if (!response.ok) {
    throw new ApiError(result.message || 'Unable to send verification code.', result.code)
  }

  return result
}

export const confirmContactSupportVerificationCode = async (email: string, code: string) => {
  const response = await fetch(createApiUrl('/contact-support/verification-code/confirm'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, email }),
  })

  const result = (await response.json()) as ContactSupportResponse

  if (!response.ok) {
    throw new ApiError(result.message || 'Unable to verify email.', result.code)
  }

  return result
}
