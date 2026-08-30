import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import Tooltip from '../../../ui/tooltip';
import { CHATS_UNREAD, ChatsUnreadSubscriptionResult } from './queries';

const intlMessages = defineMessages({
  unreadChatTooltipNone: {
    id: 'plugin.unreadChat.tooltip.none',
    defaultMessage: 'No unread messages',
  },
  unreadChatTooltipCount: {
    id: 'plugin.unreadChat.tooltip.count',
    defaultMessage: '{count} unread messages',
  },
});

interface UnreadChatButtonComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
  chatOpen: boolean;
  activeChatId: string;
  onChatToggle: () => void;
}

function UnreadChatButtonComponent(
  {
    intl, pluginApi, chatOpen, activeChatId, onChatToggle,
  }: UnreadChatButtonComponentProps,
): React.ReactNode {
  const {
    data: chatsData,
  } = pluginApi.useCustomSubscription!<ChatsUnreadSubscriptionResult>(CHATS_UNREAD);
  // Hide the active chat's stale count while its last-seen mutation is being
  // processed, but keep unread badges from other public/private conversations.
  const unreadCount = (chatsData?.chat ?? []).reduce((total, chat) => (
    total + (chatOpen && chat.chatId === activeChatId ? 0 : (chat.totalUnread ?? 0))
  ), 0);

  const tooltipMessage = unreadCount > 0
    ? intl.formatMessage(intlMessages.unreadChatTooltipCount, { count: unreadCount })
    : intl.formatMessage(intlMessages.unreadChatTooltipNone);

  return (
    <Tooltip content={tooltipMessage}>
      {({ children, styles, ...props }) => (
        <button
          {...props}
          className="media-btn"
          type="button"
          aria-pressed={chatOpen}
          style={{
            ...styles,
            backgroundColor: chatOpen ? 'rgba(255,255,255,0.15)' : undefined,
          }}
          onClick={onChatToggle}
        >
          <span className="sr-only">
            {tooltipMessage}
          </span>
          <i className="icon-bbb-group_chat" />
          {unreadCount > 0 && (
            <div className="badge">
              <span>{unreadCount}</span>
            </div>
          )}
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default UnreadChatButtonComponent;
