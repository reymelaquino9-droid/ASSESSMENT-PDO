import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  confirmContactSupportVerificationCode,
  requestContactSupportVerificationCode,
  sendContactSupportMessage,
} from '@/api'
import {
  initialContactSupportForm,
  type ContactSupportFieldErrors,
  type ContactSupportFormData,
  type ContactSupportStatus,
  type EmailVerificationStatus,
} from '@/types'
import {
  normalizeEmail,
  validateContactSupportForm,
  validateEmail,
} from '@/utils'

const verificationCodeTtlSeconds = 2 * 60

const LS_VERIFIED_EMAIL = 'contactSupportVerifiedEmail'
const LS_CODE_STATE = 'contactSupportCodeState'

type CodeState = {
  email: string
  expiresAt: number
}

const readVerifiedEmail = (): string => {
  try {
    return localStorage.getItem(LS_VERIFIED_EMAIL) || ''
  } catch {
    return ''
  }
}

const readCodeState = (): CodeState | null => {
  try {
    const raw = localStorage.getItem(LS_CODE_STATE)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CodeState
    if (!parsed.email || !parsed.expiresAt) return null
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(LS_CODE_STATE)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const saveVerifiedEmail = (email: string) => {
  try {
    localStorage.setItem(LS_VERIFIED_EMAIL, email)
  } catch {
    // ignore
  }
}

const saveCodeState = (state: CodeState | null) => {
  try {
    if (state) {
      localStorage.setItem(LS_CODE_STATE, JSON.stringify(state))
    } else {
      localStorage.removeItem(LS_CODE_STATE)
    }
  } catch {
    // ignore
  }
}

const clearVerificationStorage = () => {
  try {
    localStorage.removeItem(LS_VERIFIED_EMAIL)
    localStorage.removeItem(LS_CODE_STATE)
  } catch {
    // ignore
  }
}

export const useContactSupportForm = () => {
  const [form, setForm] = useState<ContactSupportFormData>(initialContactSupportForm)
  const [focused, setFocused] = useState<keyof ContactSupportFormData | null>(null)
  const [status, setStatus] = useState<ContactSupportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ContactSupportFieldErrors>({})
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationMessage, setVerificationMessage] = useState('')
  const [verificationSecondsLeft, setVerificationSecondsLeft] = useState(0)
  const [verificationStatus, setVerificationStatus] = useState<EmailVerificationStatus>('idle')
  const [verifiedEmail, setVerifiedEmail] = useState(readVerifiedEmail)
  const [codeState, setCodeState] = useState<CodeState | null>(readCodeState)

  const isEmpty = useMemo(
    () => !form.name && !form.email && !form.message,
    [form.email, form.message, form.name],
  )
  const normalizedEmail = normalizeEmail(form.email)
  const isEmailVerified = Boolean(normalizedEmail && verifiedEmail === normalizedEmail)

  // Restore countdown from localStorage when email matches on mount / email change
  useEffect(() => {
    if (!normalizedEmail || !codeState) return

    if (normalizedEmail !== codeState.email) {
      // Email changed, don't restore countdown
      return
    }

    const secondsLeft = Math.floor((codeState.expiresAt - Date.now()) / 1000)
    if (secondsLeft > 0) {
      setVerificationStatus('sent')
      setVerificationSecondsLeft(secondsLeft)
      setVerificationMessage('Verification code is still valid. Check your inbox.')
    } else {
      // Expired
      setCodeState(null)
      saveCodeState(null)
    }
  }, [normalizedEmail, codeState])

  // Countdown timer
  useEffect(() => {
    if (
      verificationStatus !== 'sent' &&
      verificationStatus !== 'verifying' &&
      verificationStatus !== 'error'
    ) {
      return undefined
    }

    if (verificationSecondsLeft <= 0) {
      setVerificationCode('')
      setVerificationMessage('')
      setVerificationStatus('error')
      setFieldErrors((current) => ({
        ...current,
        verificationCode: 'Verification code expired. Request a new code.',
      }))
      return undefined
    }

    const timerId = window.setTimeout(() => {
      setVerificationSecondsLeft((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [verificationSecondsLeft, verificationStatus])

  const clearFieldError = (fieldName: keyof ContactSupportFormData | 'verificationCode') => {
    setFieldErrors((current) => {
      if (!current[fieldName]) {
        return current
      }

      const remaining = { ...current }
      delete remaining[fieldName]

      return remaining
    })
  }

  const resetVerification = () => {
    setVerificationCode('')
    setVerificationMessage('')
    setVerificationSecondsLeft(0)
    setVerificationStatus('idle')
    setVerifiedEmail('')
    setCodeState(null)
    clearVerificationStorage()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    const fieldName = name as keyof ContactSupportFormData

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
    clearFieldError(fieldName)

    if (name === 'email' && normalizeEmail(value) !== verifiedEmail) {
      resetVerification()
    }

    if (status === 'error') {
      setStatus('idle')
      setErrorMessage('')
    }
  }

  const handleVerificationCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6)

    setVerificationCode(value)
    clearFieldError('verificationCode')

    if (verificationStatus === 'error' && verificationSecondsLeft > 0) {
      setVerificationStatus('sent')
      setVerificationMessage('')
    }
  }

  const handleRequestVerificationCode = async () => {
    const emailError = validateEmail(form.email)

    if (emailError) {
      setFieldErrors((current) => ({ ...current, email: emailError }))
      setStatus('error')
      return
    }

    setFieldErrors((current) => {
      const remaining = { ...current }
      delete remaining.email
      delete remaining.verificationCode

      return remaining
    })
    setErrorMessage('')
    setStatus('idle')
    setVerificationCode('')
    setVerificationMessage('')
    setVerificationSecondsLeft(0)
    setVerificationStatus('sending')
    setVerifiedEmail('')

    try {
      const result = await requestContactSupportVerificationCode(form.email)

      if (result.alreadyVerified) {
        const normalized = normalizeEmail(form.email)
        setVerifiedEmail(normalized)
        saveVerifiedEmail(normalized)
        setCodeState(null)
        saveCodeState(null)
        setVerificationStatus('verified')
        setVerificationMessage('Email already verified.')
        return
      }

      const expiresAt = result.codeExpiresAt
        ? new Date(result.codeExpiresAt).getTime()
        : Date.now() + verificationCodeTtlSeconds * 1000

      const newState: CodeState = {
        email: normalizeEmail(form.email),
        expiresAt,
      }
      setCodeState(newState)
      saveCodeState(newState)

      const secondsLeft = Math.floor((expiresAt - Date.now()) / 1000)
      setVerificationStatus('sent')
      setVerificationSecondsLeft(Math.max(secondsLeft, 0))
      setVerificationMessage(
        result.codeAlreadySent
          ? 'Code is still valid. Check your inbox.'
          : 'Verification code sent. Check your inbox.',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send verification code.'

      setVerificationStatus('error')
      setVerificationSecondsLeft(0)
      setVerificationMessage('')
      setFieldErrors((current) => ({ ...current, email: message }))
    }
  }

  const handleConfirmVerificationCode = async () => {
    if (verificationSecondsLeft <= 0) {
      setFieldErrors((current) => ({
        ...current,
        verificationCode: 'Verification code expired. Request a new code.',
      }))
      setVerificationStatus('error')
      return
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      setFieldErrors((current) => ({
        ...current,
        verificationCode: 'Enter the 6-digit verification code.',
      }))
      return
    }

    clearFieldError('verificationCode')
    setVerificationMessage('')
    setVerificationStatus('verifying')

    try {
      await confirmContactSupportVerificationCode(form.email, verificationCode)
      const normalized = normalizeEmail(form.email)
      setVerifiedEmail(normalized)
      saveVerifiedEmail(normalized)
      setCodeState(null)
      saveCodeState(null)
      setVerificationSecondsLeft(0)
      setVerificationStatus('verified')
      setVerificationMessage('Email verified.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify email.'

      setVerificationStatus('error')
      setVerificationMessage(message)
      setFieldErrors((current) => ({ ...current, verificationCode: message }))
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

    if (!isEmailVerified) {
      setFieldErrors({ email: 'Verify your email before sending.' })
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

      const errorCode = (error as any)?.code

      setFieldErrors(message.toLowerCase().includes('email') ? { email: message } : {})
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        resetVerification()
      }
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
    resetVerification()
  }

  return {
    errorMessage,
    fieldErrors,
    focused,
    form,
    isEmailVerified,
    isEmpty,
    status,
    verificationCode,
    verificationMessage,
    verificationSecondsLeft,
    verificationStatus,
    handleBlur: () => setFocused(null),
    handleChange,
    handleConfirmVerificationCode,
    handleFocus: setFocused,
    handleRequestVerificationCode,
    handleReset,
    handleSubmit,
    handleVerificationCodeChange,
  }
}
