import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import Tooltip from '../../../ui/tooltip';
import { PUBLIC_CHAT, PublicChatSubscriptionResult } from './queries';

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
  onChatToggle: () => void;
}

function UnreadChatButtonComponent(
  {
    intl, pluginApi, chatOpen, onChatToggle,
  }: UnreadChatButtonComponentProps,
): React.ReactNode {
  const {
    data: publicChat,
  } = pluginApi.useCustomSubscription!<PublicChatSubscriptionResult>(PUBLIC_CHAT);
  // The last-seen mutation is asynchronous, so hide stale server data while
  // the chat is visibly open. The subscription supplies the persisted value
  // again as soon as BBB has processed it.
  const unreadCount = chatOpen ? 0 : (publicChat?.chat[0]?.totalUnread ?? 0);

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
