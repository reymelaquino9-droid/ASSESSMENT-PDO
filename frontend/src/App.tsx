import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import './App.css'

type FormData = {
  name: string
  email: string
  message: string
}

type Status = 'idle' | 'sending' | 'success' | 'error'

const initialForm: FormData = {
  name: '',
  email: '',
  message: '',
}

const namePattern = /^[\p{L}][\p{L}\s'.-]*$/u
const nameValidationMessage =
  "Name must start with a letter and can only include letters, spaces, apostrophes, periods, or hyphens."

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="preview-avatar-icon">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function App() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [focused, setFocused] = useState<keyof FormData | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const isEmpty = useMemo(
    () => !form.name && !form.email && !form.message,
    [form.email, form.message, form.name],
  )
  const isNameInvalid = form.name.trim().length > 0 && !namePattern.test(form.name.trim())

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (status === 'error') {
      setStatus('idle')
      setErrorMessage('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    }

    if (!namePattern.test(payload.name)) {
      setStatus('error')
      setErrorMessage(nameValidationMessage)
      setFocused('name')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/contact-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to send support message.')
      }

      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send support message. Please try again.',
      )
    }
  }

  const handleReset = () => {
    setForm(initialForm)
    setFocused(null)
    setStatus('idle')
    setErrorMessage('')
  }

  return (
    <main className="support-page">
      <section className="support-shell" aria-label="Contact support">
        <aside className="preview-panel" aria-label="Message preview">
          <p className="eyebrow">Live Preview</p>

          <div className={`preview-card ${isEmpty ? 'is-empty' : 'is-active'}`}>
            <div className="preview-header">
              <div className="preview-avatar">
                <UserIcon />
              </div>

              <div className="preview-identity">
                <p>{form.name || 'Your Name'}</p>
                <span>{form.email || 'your@email.com'}</span>
              </div>

              {!isEmpty && <span className="support-badge">Support</span>}
            </div>

            <div className="preview-body">
              {isEmpty ? (
                <div className="preview-placeholder" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <p>Start typing to preview</p>
                </div>
              ) : (
                <p className={form.message ? 'preview-message' : 'preview-message muted'}>
                  {form.message || 'Your message will appear here.'}
                </p>
              )}
            </div>

            {!isEmpty && (
              <div className="preview-footer">
                <span>Ready to send</span>
                <span>{form.message.length > 0 ? `${form.message.length} chars` : 'No message yet'}</span>
              </div>
            )}
          </div>
        </aside>

        <div className="gradient-divider" aria-hidden="true" />

        <section className="form-panel">
          {status === 'success' ? (
            <div className="success-state" role="status">
              <div className="success-icon">
                <SendIcon />
              </div>
              <h1>Message sent</h1>
              <p>
                Thanks, <strong>{form.name}</strong>. We will reply to{' '}
                <strong>{form.email}</strong> as soon as possible.
              </p>
              <button type="button" className="secondary-button" onClick={handleReset}>
                Send another message
              </button>
            </div>
          ) : (
            <>
              <div className="form-heading">
                <h1>Contact Support</h1>
                <p>Send your concern and our team will review it shortly.</p>
              </div>

              <form className="support-form" onSubmit={handleSubmit}>
                <div className="field-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Emel Aquino"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    aria-describedby={isNameInvalid ? 'name-error' : undefined}
                    aria-invalid={isNameInvalid}
                    data-focused={focused === 'name'}
                    data-invalid={isNameInvalid}
                    required
                  />
                  {isNameInvalid && (
                    <p className="field-help" id="name-error">
                      {nameValidationMessage}
                    </p>
                  )}
                </div>

                <div className="field-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="emel@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    data-focused={focused === 'email'}
                    required
                  />
                </div>

                <div className="field-group">
                  <div className="label-row">
                    <label htmlFor="message">Message</label>
                    <span>{form.message.length} chars</span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Describe your issue or question."
                    value={form.message}
                    onChange={handleChange}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                    data-focused={focused === 'message'}
                    rows={6}
                    required
                  />
                </div>

                {status === 'error' && <p className="form-error">{errorMessage}</p>}

                <button type="submit" className="submit-button" disabled={status === 'sending'}>
                  <SendIcon />
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
