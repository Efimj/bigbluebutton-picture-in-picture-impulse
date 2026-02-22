import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import {
  USER_AGGREGATE_COUNT_SUBSCRIPTION,
  UsersCountSubscriptionResponse,
  USER_NAMES_SUBSCRIPTION,
  UsersNamesSubscriptionResponse,
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
});

interface UsersBadgeComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
}

function UsersBadgeComponent({ intl, pluginApi }: UsersBadgeComponentProps): React.ReactNode {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { data: countData } = pluginApi.useCustomSubscription!<UsersCountSubscriptionResponse>(
    USER_AGGREGATE_COUNT_SUBSCRIPTION,
  );
  const { data: namesData } = pluginApi.useCustomSubscription!<UsersNamesSubscriptionResponse>(
    USER_NAMES_SUBSCRIPTION,
  );

  const numOfUsers = countData?.user_aggregate?.aggregate?.count ?? 0;
  const users = namesData?.user ?? [];

  const ariaLabel = intl.formatMessage(
    numOfUsers === 1 ? intlMessages.usersTooltipSingular : intlMessages.usersTooltipPlural,
    { count: numOfUsers },
  );

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
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

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#333',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '13px',
            zIndex: 1000,
            minWidth: '140px',
            maxWidth: '220px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          <ul
            style={{
              margin: 0,
              padding: '4px 0',
              listStyle: 'none',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {users.map((u) => (
              <li
                key={u.userId}
                style={{
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {u.name}
              </li>
            ))}
          </ul>
          {/* arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '6px 6px 0 6px',
              borderColor: '#333 transparent transparent transparent',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default UsersBadgeComponent;
