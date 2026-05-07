import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import { sendContactSupportMessage } from '@/api'
import {
  initialContactSupportForm,
  type ContactSupportFieldErrors,
  type ContactSupportFormData,
  type ContactSupportStatus,
} from '@/types'
import { validateContactSupportForm } from '@/utils'

export const useContactSupportForm = () => {
  const [form, setForm] = useState<ContactSupportFormData>(initialContactSupportForm)
  const [focused, setFocused] = useState<keyof ContactSupportFormData | null>(null)
  const [status, setStatus] = useState<ContactSupportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ContactSupportFieldErrors>({})

  const isEmpty = useMemo(
    () => !form.name && !form.email && !form.message,
    [form.email, form.message, form.name],
  )

  const clearFieldError = (fieldName: keyof ContactSupportFormData) => {
    setFieldErrors((current) => {
      if (!current[fieldName]) {
        return current
      }

      const remaining = { ...current }
      delete remaining[fieldName]

      return remaining
    })
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    const fieldName = name as keyof ContactSupportFormData

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
    clearFieldError(fieldName)

    if (status === 'error') {
      setStatus('idle')
      setErrorMessage('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextFieldErrors = validateContactSupportForm(form)

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setStatus('error')
      return
    }

    setStatus('sending')
    setErrorMessage('')
    setFieldErrors({})

    try {
      await sendContactSupportMessage(form)
      setStatus('success')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to send support message. Please try again.'

      setFieldErrors(message.toLowerCase().includes('email') ? { email: message } : {})
      setStatus('error')
      setErrorMessage(message)
    }
  }

  const handleReset = () => {
    setForm(initialContactSupportForm)
    setFocused(null)
    setStatus('idle')
    setErrorMessage('')
    setFieldErrors({})
  }

  return {
    errorMessage,
    fieldErrors,
    focused,
    form,
    isEmpty,
    status,
    handleBlur: () => setFocused(null),
    handleChange,
    handleFocus: setFocused,
    handleReset,
    handleSubmit,
  }
}
