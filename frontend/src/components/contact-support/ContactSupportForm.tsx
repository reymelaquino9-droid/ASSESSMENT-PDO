import type { ChangeEvent, FormEvent } from 'react'
import { SendIcon } from '@/components/icons'
import type {
  ContactSupportFieldErrors,
  ContactSupportFormData,
  ContactSupportStatus,
  EmailVerificationStatus,
} from '@/types'
import { maxMessageLength, maxNameLength } from '@/utils'

type ContactSupportFormProps = {
  errorMessage: string
  fieldErrors: ContactSupportFieldErrors
  focused: keyof ContactSupportFormData | null
  form: ContactSupportFormData
  isEmailVerified: boolean
  status: ContactSupportStatus
  verificationCode: string
  verificationMessage: string
  verificationSecondsLeft: number
  verificationStatus: EmailVerificationStatus
  onBlur: () => void
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onConfirmVerificationCode: () => void
  onFocus: (field: keyof ContactSupportFormData) => void
  onRequestVerificationCode: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onVerificationCodeChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function ContactSupportForm({
  errorMessage,
  fieldErrors,
  focused,
  form,
  isEmailVerified,
  status,
  verificationCode,
  verificationMessage,
  verificationSecondsLeft,
  verificationStatus,
  onBlur,
  onChange,
  onConfirmVerificationCode,
  onFocus,
  onRequestVerificationCode,
  onSubmit,
  onVerificationCodeChange,
}: ContactSupportFormProps) {
  const isRequestingCode = verificationStatus === 'sending'
  const isVerifyingCode = verificationStatus === 'verifying'
  const hasRequestedCode =
    verificationStatus === 'sent' || verificationStatus === 'verifying' || verificationStatus === 'error'
  const isVerificationCodeExpired = hasRequestedCode && verificationSecondsLeft <= 0
  const showVerificationCodeInput =
    verificationStatus === 'sent' ||
    verificationStatus === 'verifying' ||
    (verificationStatus === 'error' && !isVerificationCodeExpired)
  const verificationButtonText = isEmailVerified
    ? 'Email Verified'
    : isRequestingCode
      ? 'Sending Code...'
      : hasRequestedCode
        ? 'Resend Code'
        : 'Verify Email'
  const minutesLeft = Math.floor(verificationSecondsLeft / 60)
  const secondsLeft = String(verificationSecondsLeft % 60).padStart(2, '0')

  return (
    <>
      <div className="form-heading">
        <h1>Contact Support</h1>
        <p>Send your concern and our team will review it shortly.</p>
      </div>

      <form className="support-form" onSubmit={onSubmit} noValidate>
        <div className="field-group">
          <div className="label-row">
            <label htmlFor="name">Full Name</label>
            <span className={form.name.length >= maxNameLength ? 'char-limit-warning' : ''}>
              {form.name.length}/{maxNameLength}
            </span>
          </div>
          <input
            id="name"
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-required="true"
            name="name"
            type="text"
            maxLength={maxNameLength}
            placeholder="Emel Aquino"
            value={form.name}
            onChange={onChange}
            onFocus={() => onFocus('name')}
            onBlur={onBlur}
            data-focused={focused === 'name'}
            data-invalid={Boolean(fieldErrors.name)}
          />
          {fieldErrors.name && (
            <p className="field-help" id="name-error">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="field-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-required="true"
            name="email"
            type="email"
            placeholder="emel@example.com"
            value={form.email}
            onChange={onChange}
            onFocus={() => onFocus('email')}
            onBlur={onBlur}
            data-focused={focused === 'email'}
            data-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="field-help" id="email-error">
              {fieldErrors.email}
            </p>
          )}

          <div className="verification-panel" data-status={verificationStatus}>
            <div className="verification-actions">
              <button
                type="button"
                className="inline-button"
                onClick={onRequestVerificationCode}
                disabled={isRequestingCode || isVerifyingCode || isEmailVerified || verificationSecondsLeft > 0}
              >
                {verificationButtonText}
              </button>
              {isEmailVerified && <span className="verification-badge">Verified</span>}
              {!isEmailVerified && hasRequestedCode && verificationSecondsLeft > 0 && (
                <span className="verification-countdown">
                  {minutesLeft}:{secondsLeft}
                </span>
              )}
            </div>

            {!isEmailVerified && showVerificationCodeInput && (
              <div className="verification-code-row">
                <input
                  id="verificationCode"
                  aria-describedby={fieldErrors.verificationCode ? 'verification-code-error' : undefined}
                  aria-invalid={Boolean(fieldErrors.verificationCode)}
                  inputMode="numeric"
                  name="verificationCode"
                  pattern="[0-9]*"
                  placeholder="6-digit code"
                  type="text"
                  value={verificationCode}
                  onChange={onVerificationCodeChange}
                  data-invalid={Boolean(fieldErrors.verificationCode)}
                />
                <button
                  type="button"
                  className="inline-button"
                  onClick={onConfirmVerificationCode}
                  disabled={isRequestingCode || isVerifyingCode || isVerificationCodeExpired}
                >
                  {isVerifyingCode ? 'Checking...' : 'Verify'}
                </button>
              </div>
            )}

            {fieldErrors.verificationCode && (
              <p className="field-help" id="verification-code-error">
                {fieldErrors.verificationCode}
              </p>
            )}
            {verificationMessage && !fieldErrors.verificationCode && (
              <p className="verification-message">{verificationMessage}</p>
            )}
          </div>
        </div>

        <div className="field-group">
          <div className="label-row">
            <label htmlFor="message">Message</label>
            <span className={form.message.length >= maxMessageLength ? 'char-limit-warning' : ''}>
              {form.message.length}/{maxMessageLength}
            </span>
          </div>
          <textarea
            id="message"
            aria-describedby={fieldErrors.message ? 'message-error' : undefined}
            aria-invalid={Boolean(fieldErrors.message)}
            aria-required="true"
            name="message"
            placeholder="Describe your issue or question."
            value={form.message}
            maxLength={maxMessageLength}
            onChange={onChange}
            onFocus={() => onFocus('message')}
            onBlur={onBlur}
            data-focused={focused === 'message'}
            data-invalid={Boolean(fieldErrors.message)}
            rows={6}
          />
          {fieldErrors.message && (
            <p className="field-help" id="message-error">
              {fieldErrors.message}
            </p>
          )}
        </div>

        {status === 'error' && errorMessage && <p className="form-error">{errorMessage}</p>}

        <button type="submit" className="submit-button" disabled={status === 'sending' || !isEmailVerified}>
          <SendIcon />
          {status === 'sending' ? 'Sending...' : isEmailVerified ? 'Send Message' : 'Verify Email to Send'}
        </button>
      </form>
    </>
  )
}
