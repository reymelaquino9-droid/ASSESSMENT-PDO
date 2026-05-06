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
              isEmailVerified={supportForm.isEmailVerified}
              status={supportForm.status}
              verificationCode={supportForm.verificationCode}
              verificationMessage={supportForm.verificationMessage}
              verificationSecondsLeft={supportForm.verificationSecondsLeft}
              verificationStatus={supportForm.verificationStatus}
              onBlur={supportForm.handleBlur}
              onChange={supportForm.handleChange}
              onConfirmVerificationCode={supportForm.handleConfirmVerificationCode}
              onFocus={supportForm.handleFocus}
              onRequestVerificationCode={supportForm.handleRequestVerificationCode}
              onSubmit={supportForm.handleSubmit}
              onVerificationCodeChange={supportForm.handleVerificationCodeChange}
            />
          )}
        </section>
      </section>
    </main>
  )
}
