import { UserIcon } from '@/components/icons'
import type { ContactSupportFormData } from '@/types'

type MessagePreviewProps = {
  form: ContactSupportFormData
  isEmpty: boolean
}

export function MessagePreview({ form, isEmpty }: MessagePreviewProps) {
  return (
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
  )
}
