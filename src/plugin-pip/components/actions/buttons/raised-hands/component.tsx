import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { RAISED_HAND_USERS, RaisedHandUsersSubscriptionResult } from './queries';

interface RaisedHandsButtonComponentProps {
  pluginApi: PluginApi;
  pipWindow: Window;
}

function RaisedHandsButtonComponent(
  { pluginApi, pipWindow }: RaisedHandsButtonComponentProps,
): React.ReactNode {
  const {
    data: raisedHandUsers,
  } = pluginApi.useCustomSubscription!<RaisedHandUsersSubscriptionResult>(RAISED_HAND_USERS);
  const raisedHandCount = raisedHandUsers?.user_aggregate.aggregate.count ?? 0;
  const disabled = raisedHandCount === 0;

  return (
    <button
      className="media-btn"
      type="button"
      disabled={disabled}
      onClick={() => {
        pipWindow.close();
      }}
    >
      <i className="icon-bbb-hand" />
      {!disabled && (
        <div className="badge">
          <span>
            {raisedHandUsers?.user_aggregate.aggregate.count}
          </span>
        </div>
      )}
    </button>
  );
}

export default RaisedHandsButtonComponent;
