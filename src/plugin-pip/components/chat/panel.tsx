import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import {
  CHAT_ALL_MESSAGES_FALLBACK_SUBSCRIPTION,
  CHAT_ALL_MESSAGES_SUBSCRIPTION,
  CHAT_SET_LAST_SEEN,
  ChatAllMessagesResponse,
  ChatMessage,
  ChatSetLastSeenVariables,
  getChatMessageKey,
  sortChatMessages,
} from './queries';
import AttachmentList from './attachment-list';
import {
  CHAT_ATTACHMENT_MAX_FILES,
  CHAT_ATTACHMENT_MAX_FILE_SIZE,
  ChatAttachment,
  formatAttachmentSize,
  parseChatAttachments,
  removeAttachmentMarkersFromHtml,
  serializeChatAttachment,
  uploadChatAttachment,
} from './attachments';

const intlMessages = defineMessages({
  title: {
    id: 'plugin.chat.panel.title',
    defaultMessage: 'Public Chat',
  },
  empty: {
    id: 'plugin.chat.panel.empty',
    defaultMessage: 'No messages yet',
  },
  close: {
    id: 'plugin.chat.panel.close',
    defaultMessage: 'Close chat',
  },
  unknownUser: {
    id: 'plugin.chat.panel.unknownUser',
    defaultMessage: 'Unknown User',
  },
  inputLabel: {
    id: 'plugin.chat.panel.inputLabel',
    defaultMessage: 'Chat message',
  },
  inputPlaceholder: {
    id: 'plugin.chat.panel.inputPlaceholder',
    defaultMessage: 'Message',
  },
  send: {
    id: 'plugin.chat.panel.send',
    defaultMessage: 'Send',
  },
  attachmentAdd: {
    id: 'plugin.chat.attachment.add',
    defaultMessage: 'Attach files',
  },
  attachmentRemove: {
    id: 'plugin.chat.attachment.remove',
    defaultMessage: 'Remove {name}',
  },
  attachmentUploading: {
    id: 'plugin.chat.attachment.uploading',
    defaultMessage: 'Uploading…',
  },
  attachmentTooLarge: {
    id: 'plugin.chat.attachment.tooLarge',
    defaultMessage: 'The file is too large. Maximum size: {size}',
  },
  attachmentTooMany: {
    id: 'plugin.chat.attachment.tooMany',
    defaultMessage: 'You can attach up to {count} files',
  },
  attachmentUploadFailed: {
    id: 'plugin.chat.attachment.uploadFailed',
    defaultMessage: 'Could not upload the file',
  },
});

interface ChatPanelProps {
  intl: IntlShape;
  pluginApi: PluginApi;
  onClose: () => void;
  /** Bottom offset in px to leave the actions bar visible */
  actionsHeight: number;
  streamMessages: ChatMessage[];
  isOpen: boolean;
}

function ChatPanel({
  intl, pluginApi, onClose, actionsHeight, streamMessages, isOpen,
}: ChatPanelProps): React.ReactNode {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const lastSeenRequestRef = React.useRef('');
  const [draftMessage, setDraftMessage] = React.useState('');
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([]);
  const [attachmentUploading, setAttachmentUploading] = React.useState(false);
  const [attachmentError, setAttachmentError] = React.useState('');
  const [setChatLastSeen] = pluginApi
    .useCustomMutation!<ChatSetLastSeenVariables>(CHAT_SET_LAST_SEEN);
  const { data: meeting } = pluginApi.useMeetingData!();
  const meetingId = meeting?.meetingId ?? '';
  const sessionToken = pluginApi.getSessionToken?.() ?? '';

  const { data } = pluginApi.useCustomSubscription!<ChatAllMessagesResponse>(
    CHAT_ALL_MESSAGES_SUBSCRIPTION,
  );
  const { data: fallbackData } = pluginApi.useCustomSubscription!<ChatAllMessagesResponse>(
    CHAT_ALL_MESSAGES_FALLBACK_SUBSCRIPTION,
  );

  const publicMessages = data?.chat_message ?? [];
  const fallbackMessages = fallbackData?.chat_message ?? [];

  const messages = React.useMemo<ChatMessage[]>(() => {
    const baseMessages = publicMessages.length > 0 ? publicMessages : fallbackMessages;
    const merged = [...baseMessages, ...streamMessages];

    const byId = new Map<string, ChatMessage>();
    merged.forEach((msg) => {
      byId.set(getChatMessageKey(msg), msg);
    });

    return sortChatMessages(Array.from(byId.values()));
  }, [publicMessages, fallbackMessages, streamMessages]);

  React.useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages.length]);

  const lastMessage = messages[messages.length - 1];
  const lastSeenRequestKey = lastMessage?.chatId && lastMessage?.createdAt
    ? `${lastMessage.chatId}|${lastMessage.createdAt}`
    : '';

  React.useEffect(() => {
    if (!isOpen || !lastSeenRequestKey || lastSeenRequestRef.current === lastSeenRequestKey) return;

    lastSeenRequestRef.current = lastSeenRequestKey;
    setChatLastSeen({
      variables: {
        chatId: lastMessage.chatId,
        lastSeenAt: lastMessage.createdAt,
      },
    });
  }, [isOpen, lastMessage?.chatId, lastMessage?.createdAt, lastSeenRequestKey, setChatLastSeen]);

  const canSendMessage = Boolean(pluginApi.serverCommands?.chat?.sendPublicChatMessage);
  const trimmedDraftMessage = draftMessage.trim();
  const canSubmit = canSendMessage
    && !attachmentUploading
    && Boolean(trimmedDraftMessage || attachments.length > 0);

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (selectedFiles.length === 0) return;

    if (attachments.length + selectedFiles.length > CHAT_ATTACHMENT_MAX_FILES) {
      setAttachmentError(intl.formatMessage(intlMessages.attachmentTooMany, {
        count: CHAT_ATTACHMENT_MAX_FILES,
      }));
      return;
    }

    if (selectedFiles.some((file) => file.size > CHAT_ATTACHMENT_MAX_FILE_SIZE)) {
      setAttachmentError(intl.formatMessage(intlMessages.attachmentTooLarge, {
        size: formatAttachmentSize(CHAT_ATTACHMENT_MAX_FILE_SIZE, intl.locale),
      }));
      return;
    }

    setAttachmentUploading(true);
    setAttachmentError('');
    try {
      const results = await Promise.allSettled(
        selectedFiles.map((file) => uploadChatAttachment(file, sessionToken)),
      );
      const uploaded = results.flatMap((result) => (
        result.status === 'fulfilled' ? [result.value] : []
      ));
      if (uploaded.length > 0) setAttachments((current) => [...current, ...uploaded]);
      if (results.some((result) => result.status === 'rejected')) {
        setAttachmentError(intl.formatMessage(intlMessages.attachmentUploadFailed));
      }
    } finally {
      setAttachmentUploading(false);
    }
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const attachmentMarkers = attachments.map(serializeChatAttachment);
    const outgoingMessage = [trimmedDraftMessage, ...attachmentMarkers].filter(Boolean).join('\n');

    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: outgoingMessage,
    });
    setDraftMessage('');
    setAttachments([]);
    setAttachmentError('');
  };

  const getRoleColor = (role: string | null): string => {
    if (role === 'MODERATOR') return '#3b82f6';
    if (role === 'VIEWER') return '#8b5cf6';
    return '#6b7280';
  };

  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name.substring(0, 2);
  };

  const isSystemMessage = (msg: ChatMessage) => {
    // Some deployments send user chat with different messageType values.
    // If a sender exists, treat it as a regular user message.
    const hasAuthor = Boolean(msg.senderName || msg.senderId);
    if (hasAuthor) return false;
    return msg.messageType !== 'USER_MESSAGE';
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: actionsHeight,
        backgroundColor: 'rgba(20, 20, 20, 0.97)',
        zIndex: 200,
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        backdropFilter: 'blur(4px)',
      }}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <span style={{
          color: '#fff', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
        }}
        >
          <i className="icon-bbb-group_chat" />
          {intl.formatMessage(intlMessages.title)}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={intl.formatMessage(intlMessages.close)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            padding: '0 4px',
            borderRadius: '4px',
          }}
        >
          ×
        </button>
      </div>

      {/* Messages list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: 'rgba(255,255,255,0.35)',
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '12px',
            }}
          >
            {intl.formatMessage(intlMessages.empty)}
          </div>
        )}

        {messages.map((msg) => {
          if (isSystemMessage(msg)) {
            return (
              <div
                key={getChatMessageKey(msg)}
                style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                  padding: '2px 0',
                }}
              >
                {msg.message}
              </div>
            );
          }

          const senderName = msg.senderName || intl.formatMessage(intlMessages.unknownUser);
          const parsedAttachments = parseChatAttachments(msg.message);
          const visibleMessage = removeAttachmentMarkersFromHtml(
            msg.messageAsHtml,
            parsedAttachments.markerLines,
          );

          return (
            <div key={getChatMessageKey(msg)} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: msg.senderRole === 'VIEWER' ? '50%' : '5px',
                  backgroundColor: getRoleColor(msg.senderRole),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                  textTransform: 'capitalize',
                }}
              >
                {getInitials(senderName)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'baseline',
                    marginBottom: '1px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {senderName}
                  </span>
                  {msg.createdAt && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                      {intl.formatTime(msg.createdAt, { hour: '2-digit', minute: '2-digit', hourCycle: 'h24' })}
                    </span>
                  )}
                </div>
                {/* eslint-disable react/no-danger */}
                {visibleMessage ? (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.85)',
                      wordBreak: 'break-word',
                      lineHeight: '1.4',
                    }}
                    dangerouslySetInnerHTML={{ __html: visibleMessage }}
                  />
                ) : null}
                {/* eslint-enable react/no-danger */}
                {parsedAttachments.attachments.length > 0 ? (
                  <AttachmentList
                    attachments={parsedAttachments.attachments}
                    intl={intl}
                    meetingId={meetingId}
                    sessionToken={sessionToken}
                  />
                ) : null}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '6px 8px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFilesSelected}
          tabIndex={-1}
          style={{ display: 'none' }}
        />
        {attachments.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {attachments.map((attachment) => (
              <span
                key={attachment.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  maxWidth: '100%',
                  padding: '3px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '10px',
                }}
              >
                <span aria-hidden="true">📎</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachment.name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                  {formatAttachmentSize(attachment.size, intl.locale)}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachments((current) => (
                    current.filter(({ id }) => id !== attachment.id)
                  ))}
                  aria-label={intl.formatMessage(
                    intlMessages.attachmentRemove,
                    { name: attachment.name },
                  )}
                  title={intl.formatMessage(
                    intlMessages.attachmentRemove,
                    { name: attachment.name },
                  )}
                  style={{
                    border: 0, background: 'none', color: '#fff', padding: 0, cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {attachmentError ? (
          <span role="alert" style={{ color: '#fca5a5', fontSize: '10px' }}>{attachmentError}</span>
        ) : null}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder={intl.formatMessage(intlMessages.inputPlaceholder)}
            aria-label={intl.formatMessage(intlMessages.inputLabel)}
            disabled={!canSendMessage || attachmentUploading}
            style={{
              flex: 1,
              minWidth: 0,
              height: '30px',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: '12px',
              padding: '0 8px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canSendMessage
              || attachmentUploading
              || attachments.length >= CHAT_ATTACHMENT_MAX_FILES}
            aria-label={intl.formatMessage(intlMessages.attachmentAdd)}
            title={intl.formatMessage(intlMessages.attachmentAdd)}
            style={{
              height: '30px',
              width: '34px',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#fff',
              cursor: attachmentUploading ? 'default' : 'pointer',
            }}
          >
            {attachmentUploading ? '…' : '📎'}
            <span className="sr-only">
              {attachmentUploading
                ? intl.formatMessage(intlMessages.attachmentUploading)
                : intl.formatMessage(intlMessages.attachmentAdd)}
            </span>
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              height: '30px',
              minWidth: '54px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: canSubmit ? '#3b82f6' : 'rgba(255,255,255,0.12)',
              color: '#fff',
              cursor: canSubmit ? 'pointer' : 'default',
              fontSize: '12px',
              fontWeight: 600,
              padding: '0 10px',
            }}
          >
            {intl.formatMessage(intlMessages.send)}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatPanel;
