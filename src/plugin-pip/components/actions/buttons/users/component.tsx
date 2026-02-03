import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import { USER_AGGREGATE_COUNT_SUBSCRIPTION, UsersCountSubscriptionResponse } from './queries';
import Tooltip from '../../../ui/tooltip';

const intlMessages = defineMessages({
  usersTooltipSingular: {
    id: 'plugin.users.tooltip.singular',
    defaultMessage: '{count} user in the session',
  },
  usersTooltipPlural: {
    id: 'plugin.users.tooltip.plural',
    defaultMessage: '{count} users in the session',
  },
});

interface UsersBadgeComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
}

function UsersBadgeComponent({ intl, pluginApi }: UsersBadgeComponentProps): React.ReactNode {
  const { data } = pluginApi.useCustomSubscription!<UsersCountSubscriptionResponse>(
    USER_AGGREGATE_COUNT_SUBSCRIPTION,
  );
  const numOfUsers = data?.user_aggregate?.aggregate?.count ?? 0;

  const tooltipMessage = numOfUsers === 1
    ? intlMessages.usersTooltipSingular
    : intlMessages.usersTooltipPlural;

  const tooltipLabel = intl.formatMessage(tooltipMessage, { count: numOfUsers });

  return (
    <Tooltip content={tooltipLabel}>
      {({ styles, children, ...props }) => (
        <button
          {...props}
          type="button"
          style={{
            ...styles,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.35rem 0.6rem',
            borderRadius: '1rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            userSelect: 'none',
            border: 'none',
          }}
        >
          <span className="sr-only">{tooltipLabel}</span>
          <i className="icon-bbb-user" />
          <span>{numOfUsers}</span>
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default UsersBadgeComponent;
