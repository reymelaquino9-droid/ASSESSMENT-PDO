import type { ChangeEvent, FormEvent } from 'react'
import { SendIcon } from '@/components/icons'
import type {
  ContactSupportFieldErrors,
  ContactSupportFormData,
  ContactSupportStatus,
} from '@/types'
import { maxMessageLength, maxNameLength } from '@/utils'

type ContactSupportFormProps = {
  errorMessage: string
  fieldErrors: ContactSupportFieldErrors
  focused: keyof ContactSupportFormData | null
  form: ContactSupportFormData
  status: ContactSupportStatus
  onBlur: () => void
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onFocus: (field: keyof ContactSupportFormData) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ContactSupportForm({
  errorMessage,
  fieldErrors,
  focused,
  form,
  status,
  onBlur,
  onChange,
  onFocus,
  onSubmit,
}: ContactSupportFormProps) {
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

        <button type="submit" className="submit-button" disabled={status === 'sending'}>
          <SendIcon />
          {status === 'sending' ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </>
  )
}
