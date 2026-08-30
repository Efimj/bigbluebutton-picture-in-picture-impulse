import * as React from 'react';
import { defineMessages, IntlShape } from 'react-intl';
import {
  ChatAttachment,
  chatAttachmentUrl,
  formatAttachmentSize,
} from './attachments';

const intlMessages = defineMessages({
  attachedFile: {
    id: 'plugin.chat.attachment.file',
    defaultMessage: 'Attached file',
  },
  preview: {
    id: 'plugin.chat.attachment.preview',
    defaultMessage: 'Preview {name}',
  },
  closePreview: {
    id: 'plugin.chat.attachment.closePreview',
    defaultMessage: 'Close preview',
  },
  download: {
    id: 'plugin.chat.attachment.download',
    defaultMessage: 'Download {name}',
  },
});

interface AttachmentListProps {
  attachments: ChatAttachment[];
  intl: IntlShape;
  meetingId: string;
  sessionToken: string;
}

function AttachmentList({
  attachments, intl, meetingId, sessionToken,
}: AttachmentListProps): React.ReactNode {
  const [previewAttachment, setPreviewAttachment] = React.useState<ChatAttachment | null>(null);

  return (
    <>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px',
      }}
      >
        {attachments.map((attachment) => {
          const previewUrl = chatAttachmentUrl(attachment, meetingId, sessionToken, true);
          const downloadUrl = chatAttachmentUrl(attachment, meetingId, sessionToken);
          return (
            <div
              key={attachment.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '5px',
                padding: '4px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                minWidth: 0,
              }}
            >
              {attachment.previewableImage ? (
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(attachment)}
                  aria-label={intl.formatMessage(intlMessages.preview, { name: attachment.name })}
                  title={intl.formatMessage(intlMessages.preview, { name: attachment.name })}
                  style={{
                    width: '38px',
                    height: '38px',
                    border: 0,
                    padding: 0,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={previewUrl}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ) : (
                <span aria-hidden="true" style={{ fontSize: '20px', width: '38px', textAlign: 'center' }}>📎</span>
              )}
              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  title={attachment.name}
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                >
                  {attachment.name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>
                  {`${intl.formatMessage(intlMessages.attachedFile)} · ${formatAttachmentSize(attachment.size, intl.locale)}`}
                </span>
              </span>
              <a
                href={downloadUrl}
                download={attachment.name}
                aria-label={intl.formatMessage(intlMessages.download, { name: attachment.name })}
                title={intl.formatMessage(intlMessages.download, { name: attachment.name })}
                style={{
                  color: '#fff', padding: '6px', textDecoration: 'none', flexShrink: 0,
                }}
              >
                <i className="icon-bbb-download" />
              </a>
            </div>
          );
        })}
      </div>
      {previewAttachment ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewAttachment.name}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '6px',
            padding: '34px 10px 10px',
            backgroundColor: 'rgba(0,0,0,0.9)',
          }}
        >
          <button
            type="button"
            onClick={() => setPreviewAttachment(null)}
            aria-label={intl.formatMessage(intlMessages.closePreview)}
            title={intl.formatMessage(intlMessages.closePreview)}
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              color: '#fff',
              background: 'none',
              border: 0,
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
          <img
            src={chatAttachmentUrl(previewAttachment, meetingId, sessionToken, true)}
            alt={previewAttachment.name}
            style={{ maxWidth: '100%', maxHeight: 'calc(100% - 24px)', objectFit: 'contain' }}
          />
          <span style={{ color: '#fff', fontSize: '11px' }}>{previewAttachment.name}</span>
        </div>
      ) : null}
    </>
  );
}

export default AttachmentList;
