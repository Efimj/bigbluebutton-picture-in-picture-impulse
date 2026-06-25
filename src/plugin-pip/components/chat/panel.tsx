import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import {
  CHAT_ALL_MESSAGES_FALLBACK_SUBSCRIPTION,
  CHAT_ALL_MESSAGES_SUBSCRIPTION,
  ChatAllMessagesResponse,
  ChatMessage,
  getChatMessageKey,
  sortChatMessages,
} from './queries';

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
});

interface ChatPanelProps {
  intl: IntlShape;
  pluginApi: PluginApi;
  onClose: () => void;
  /** Bottom offset in px to leave the actions bar visible */
  actionsHeight: number;
  streamMessages: ChatMessage[];
}

function ChatPanel({
  intl, pluginApi, onClose, actionsHeight, streamMessages,
}: ChatPanelProps): React.ReactNode {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [draftMessage, setDraftMessage] = React.useState('');

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const canSendMessage = Boolean(pluginApi.serverCommands?.chat?.sendPublicChatMessage);
  const trimmedDraftMessage = draftMessage.trim();

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedDraftMessage || !canSendMessage) return;

    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: trimmedDraftMessage,
    });
    setDraftMessage('');
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
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.85)',
                    wordBreak: 'break-word',
                    lineHeight: '1.4',
                  }}
                  dangerouslySetInnerHTML={{ __html: msg.messageAsHtml || msg.message }}
                />
                {/* eslint-enable react/no-danger */}
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
          gap: '6px',
          padding: '6px 8px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          placeholder={intl.formatMessage(intlMessages.inputPlaceholder)}
          aria-label={intl.formatMessage(intlMessages.inputLabel)}
          disabled={!canSendMessage}
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
          type="submit"
          disabled={!trimmedDraftMessage || !canSendMessage}
          style={{
            height: '30px',
            minWidth: '54px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: trimmedDraftMessage && canSendMessage ? '#3b82f6' : 'rgba(255,255,255,0.12)',
            color: '#fff',
            cursor: trimmedDraftMessage && canSendMessage ? 'pointer' : 'default',
            fontSize: '12px',
            fontWeight: 600,
            padding: '0 10px',
          }}
        >
          {intl.formatMessage(intlMessages.send)}
        </button>
      </form>
    </div>
  );
}

export default ChatPanel;
