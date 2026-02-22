import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import { CHAT_ALL_MESSAGES_SUBSCRIPTION, ChatAllMessagesResponse } from './queries';

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
});

interface ChatPanelProps {
  intl: IntlShape;
  pluginApi: PluginApi;
  onClose: () => void;
  /** Bottom offset in px to leave the actions bar visible */
  actionsHeight: number;
}

function ChatPanel({
  intl, pluginApi, onClose, actionsHeight,
}: ChatPanelProps): React.ReactNode {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { data } = pluginApi.useCustomSubscription!<ChatAllMessagesResponse>(
    CHAT_ALL_MESSAGES_SUBSCRIPTION,
  );
  const messages = data?.chat_message ?? [];

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const getRoleColor = (role: string | null): string => {
    if (role === 'MODERATOR') return '#3b82f6';
    if (role === 'VIEWER') return '#8b5cf6';
    return '#6b7280';
  };

  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name.substring(0, 2);
  };

  const isSystemMessage = (type: string) => type !== 'USER_MESSAGE';

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
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(4px)',
      }}
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
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
          if (isSystemMessage(msg.messageType)) {
            return (
              <div
                key={msg.messageId}
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

          return (
            <div key={msg.messageId} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
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
                {getInitials(msg.senderName)}
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
                    {msg.senderName}
                  </span>
                  {msg.createdAt && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                      {intl.formatTime(msg.createdAt, { hour: '2-digit', minute: '2-digit', hourCycle: 'h24' })}
                    </span>
                  )}
                </div>
                {/* eslint-disable-next-line react/no-danger */}
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.85)',
                    wordBreak: 'break-word',
                    lineHeight: '1.4',
                  }}
                  dangerouslySetInnerHTML={{ __html: msg.messageAsHtml }}
                />
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatPanel;
