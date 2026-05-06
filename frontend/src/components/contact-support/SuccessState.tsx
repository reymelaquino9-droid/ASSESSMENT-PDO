import { SendIcon } from '@/components/icons'
import type { ContactSupportFormData } from '@/types'

type SuccessStateProps = {
  form: ContactSupportFormData
  onReset: () => void
}

export function SuccessState({ form, onReset }: SuccessStateProps) {
  return (
    <div className="success-state" role="status">
      <div className="success-icon">
        <SendIcon />
      </div>
      <h1>Message sent</h1>
      <p>
        Thanks, <strong>{form.name}</strong>. We will reply to <strong>{form.email}</strong> as soon
        as possible.
      </p>
      <button type="button" className="secondary-button" onClick={onReset}>
        Send another message
      </button>
    </div>
  )
}
