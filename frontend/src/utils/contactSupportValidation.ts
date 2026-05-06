import type { ContactSupportFieldErrors, ContactSupportFormData } from '@/types'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const maxMessageLength = 2000

export const maxNameLength = 80
const maxEmailLength = 254

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const validateEmail = (emailValue: string) => {
  const email = emailValue.trim()

  if (!email) {
    return 'Email address is required.'
  }

  if (email.length > maxEmailLength || !emailPattern.test(email)) {
    return 'Enter a valid email address.'
  }

  return ''
}

export const validateContactSupportForm = (form: ContactSupportFormData): ContactSupportFieldErrors => {
  const errors: ContactSupportFieldErrors = {}
  const name = form.name.trim()
  const email = form.email.trim()
  const message = form.message.trim()

  if (!name) {
    errors.name = 'Full name is required.'
  } else if (name.length > maxNameLength) {
    errors.name = `Full name must be ${maxNameLength} characters or less.`
  }

  const emailError = validateEmail(email)

  if (emailError) {
    errors.email = emailError
  }

  if (!message) {
    errors.message = 'Message is required.'
  } else if (message.length > maxMessageLength) {
    errors.message = `Message must be ${maxMessageLength} characters or less.`
  }

  return errors
}
