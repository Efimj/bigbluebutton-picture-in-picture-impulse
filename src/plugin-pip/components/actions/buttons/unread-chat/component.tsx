import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { PUBLIC_CHAT, PublicChatSubscriptionResult } from './queries';

interface UnreadChatButtonComponentProps {
  pluginApi: PluginApi;
  pipWindow: Window;
}

function UnreadChatButtonComponent(
  { pluginApi, pipWindow }: UnreadChatButtonComponentProps,
): React.ReactNode {
  const {
    data: publicChat,
  } = pluginApi.useCustomSubscription!<PublicChatSubscriptionResult>(PUBLIC_CHAT);
  const unreadCount = publicChat?.chat[0]?.totalUnread ?? 0;
  const disabled = unreadCount === 0;

  return (
    <button
      className="media-btn"
      type="button"
      disabled={disabled}
      onClick={() => {
        pluginApi.uiCommands.chat.form.open();
        pipWindow.close();
      }}
    >
      <i className="icon-bbb-group_chat" />
      {!disabled && (
        <div className="badge">
          <span>
            {publicChat?.chat[0].totalUnread}
          </span>
        </div>
      )}
    </button>
  );
}

export default UnreadChatButtonComponent;
