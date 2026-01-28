import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import Tooltip from '../../../ui/tooltip';
import { RAISED_HAND_USERS, RaisedHandUsersSubscriptionResult } from './queries';

const intlMessages = defineMessages({
  raisedHandsTooltipNone: {
    id: 'plugin.raisedHands.tooltip.none',
    defaultMessage: 'No raised hand',
  },
  raisedHandsTooltipCount: {
    id: 'plugin.raisedHands.tooltip.count',
    defaultMessage: '{count} raised hands',
  },
});

interface RaisedHandsButtonComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
  pipWindow: Window;
}

function RaisedHandsButtonComponent(
  { intl, pluginApi, pipWindow }: RaisedHandsButtonComponentProps,
): React.ReactNode {
  const {
    data: raisedHandUsers,
  } = pluginApi.useCustomSubscription!<RaisedHandUsersSubscriptionResult>(RAISED_HAND_USERS);
  const raisedHandCount = raisedHandUsers?.user_aggregate.aggregate.count ?? 0;
  const disabled = raisedHandCount === 0;

  const tooltipMessage = raisedHandCount > 0
    ? intl.formatMessage(intlMessages.raisedHandsTooltipCount, { count: raisedHandCount })
    : intl.formatMessage(intlMessages.raisedHandsTooltipNone);

  return (
    <Tooltip content={tooltipMessage}>
      <button
        className="media-btn"
        type="button"
        disabled={disabled}
        onClick={() => {
          pipWindow.close();
        }}
      >
        <span className="sr-only">
          {tooltipMessage}
        </span>
        <i className="icon-bbb-hand" />
        {!disabled && (
        <div className="badge" aria-hidden>
          <span>
            {raisedHandUsers?.user_aggregate.aggregate.count}
          </span>
        </div>
        )}
      </button>
    </Tooltip>
  );
}

export default RaisedHandsButtonComponent;
