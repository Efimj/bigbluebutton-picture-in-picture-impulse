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
  pipWindow: Window;
}

function UnreadChatButtonComponent(
  { intl, pluginApi, pipWindow }: UnreadChatButtonComponentProps,
): React.ReactNode {
  const {
    data: publicChat,
  } = pluginApi.useCustomSubscription!<PublicChatSubscriptionResult>(PUBLIC_CHAT);
  const unreadCount = publicChat?.chat[0]?.totalUnread ?? 0;
  const disabled = unreadCount === 0;

  const tooltipMessage = unreadCount > 0
    ? intl.formatMessage(intlMessages.unreadChatTooltipCount, { count: unreadCount })
    : intl.formatMessage(intlMessages.unreadChatTooltipNone);

  return (
    <Tooltip content={tooltipMessage}>
      <button
        className="media-btn"
        type="button"
        disabled={disabled}
        onClick={() => {
          pluginApi.uiCommands.chat.form.open();
          pipWindow.close();
        }}
      >
        <span className="sr-only">
          {tooltipMessage}
        </span>
        <i className="icon-bbb-group_chat" />
        {!disabled && (
        <div className="badge" aria-hidden>
          <span>
            {publicChat?.chat[0].totalUnread}
          </span>
        </div>
        )}
      </button>
    </Tooltip>
  );
}

export default UnreadChatButtonComponent;
