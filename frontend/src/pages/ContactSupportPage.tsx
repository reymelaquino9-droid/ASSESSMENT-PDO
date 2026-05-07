import { ContactSupportForm, MessagePreview, SuccessState } from '@/components/contact-support'
import { useContactSupportForm } from '@/hooks'
import '@/styles/support.css'

export function ContactSupportPage() {
  const supportForm = useContactSupportForm()

  return (
    <main className="support-page">
      <section className="support-shell" aria-label="Contact support">
        <MessagePreview form={supportForm.form} isEmpty={supportForm.isEmpty} />

        <div className="gradient-divider" aria-hidden="true" />

        <section className="form-panel">
          {supportForm.status === 'success' ? (
            <SuccessState form={supportForm.form} onReset={supportForm.handleReset} />
          ) : (
            <ContactSupportForm
              errorMessage={supportForm.errorMessage}
              fieldErrors={supportForm.fieldErrors}
              focused={supportForm.focused}
              form={supportForm.form}
              status={supportForm.status}
              onBlur={supportForm.handleBlur}
              onChange={supportForm.handleChange}
              onFocus={supportForm.handleFocus}
              onSubmit={supportForm.handleSubmit}
            />
          )}
        </section>
      </section>
    </main>
  )
}
