import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import {
  USER_AGGREGATE_COUNT_SUBSCRIPTION,
  UsersCountSubscriptionResponse,
  WAITING_USERS_SUBSCRIPTION,
  WaitingUsersSubscriptionResponse,
} from './queries';

const intlMessages = defineMessages({
  usersTooltipSingular: {
    id: 'plugin.users.tooltip.singular',
    defaultMessage: '{count} user in the session',
  },
  usersTooltipPlural: {
    id: 'plugin.users.tooltip.plural',
    defaultMessage: '{count} users in the session',
  },
  openParticipants: {
    id: 'plugin.users.openParticipants',
    defaultMessage: 'Open participants',
  },
  waitingUsers: {
    id: 'plugin.users.waiting',
    defaultMessage: '{count} waiting',
  },
});

interface UsersBadgeComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
  open: boolean;
  onToggle: () => void;
}

function UsersBadgeComponent({
  intl, pluginApi, open, onToggle,
}: UsersBadgeComponentProps): React.ReactNode {
  const { data: countData } = pluginApi.useCustomSubscription!<UsersCountSubscriptionResponse>(
    USER_AGGREGATE_COUNT_SUBSCRIPTION,
  );
  const { data: waitingUsersData } = pluginApi
    .useCustomSubscription!<WaitingUsersSubscriptionResponse>(
      WAITING_USERS_SUBSCRIPTION,
    );

  const numOfUsers = countData?.user_aggregate?.aggregate?.count ?? 0;
  const numOfWaitingUsers = waitingUsersData?.user_guest?.length ?? 0;
  const usersCountLabel = intl.formatMessage(
    numOfUsers === 1 ? intlMessages.usersTooltipSingular : intlMessages.usersTooltipPlural,
    { count: numOfUsers },
  );
  const openParticipantsLabel = intl.formatMessage(intlMessages.openParticipants);
  const waitingUsersLabel = intl.formatMessage(
    intlMessages.waitingUsers,
    { count: numOfWaitingUsers },
  );
  const ariaLabel = [openParticipantsLabel, usersCountLabel];

  if (numOfWaitingUsers > 0) ariaLabel.push(waitingUsersLabel);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={ariaLabel.join('. ')}
        aria-expanded={open}
        title={openParticipantsLabel}
        onClick={onToggle}
        style={{
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
          cursor: 'pointer',
        }}
      >
        <i className="icon-bbb-user" />
        <span>{numOfUsers}</span>
      </button>

      {numOfWaitingUsers > 0 && (
        <span
          aria-label={waitingUsersLabel}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: '2px solid #303030',
            borderRadius: '9px',
            fontSize: '10px',
            fontWeight: 700,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {numOfWaitingUsers > 99 ? '99+' : numOfWaitingUsers}
        </span>
      )}
    </div>
  );
}

export default UsersBadgeComponent;
