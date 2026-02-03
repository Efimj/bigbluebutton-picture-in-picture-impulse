import * as React from 'react';
import { PluginApi, CurrentUserData } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import Tooltip from '../../../ui/tooltip';
import { RAISED_HAND_USERS, RaisedHandUsersSubscriptionResponse, RaisedHandUser } from './queries';
import Popover from '../../../ui/popover';
import { SET_RAISE_HAND } from '../../../raised-hands/mutations';
import { Modal, ModalButton } from '../../../ui/modal';

const intlMessages = defineMessages({
  raisedHandsTooltipNone: {
    id: 'plugin.raisedHands.tooltip.none',
    defaultMessage: 'No raised hand',
  },
  raisedHandsTooltipCountPlural: {
    id: 'plugin.raisedHands.tooltip.count.plural',
    defaultMessage: '{count} raised hands',
  },
  raisedHandsTooltipCountSingular: {
    id: 'plugin.raisedHands.tooltip.count.singular',
    defaultMessage: '{count} raised hand',
  },
  commonCancel: {
    id: 'plugin.common.cancel',
    defaultMessage: 'Cancel',
  },
  commonConfirm: {
    id: 'plugin.common.confirm',
    defaultMessage: 'Confirm',
  },
  raisedHandsStatus: {
    id: 'plugin.raisedHands.status',
    defaultMessage: 'raised hand',
  },
  raisedHandsLowerHand: {
    id: 'plugin.raisedHands.lowerHand',
    defaultMessage: "Lower User's Hand",
  },
  raisedHandsModalTitle: {
    id: 'plugin.raisedHands.modal.title',
    defaultMessage: 'Lower Hand',
  },
  raisedHandsModalConfirm: {
    id: 'plugin.raisedHands.modal.confirm',
    defaultMessage: "Are you sure you want to lower {name}'s hand?",
  },
  raisedHandsModalConfirmCurrent: {
    id: 'plugin.raisedHands.modal.confirmCurrent',
    defaultMessage: 'Are you sure you want to lower your hand?',
  },
  raisedHandsDropdownTitle: {
    id: 'plugin.raisedHands.dropdown.title',
    defaultMessage: 'Raised Hands ({count})',
  },
  raisedHandsDropdownYou: {
    id: 'plugin.raisedHands.dropdown.you',
    defaultMessage: 'you',
  },
  raisedHandsDropdownLower: {
    id: 'plugin.raisedHands.dropdown.lower',
    defaultMessage: 'Lower',
  },
});

interface RaisedHandsButtonComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
}

interface UserAvatarProps {
  name: string;
  color: string;
  isModerator: boolean;
  position: number;
}

function UserAvatar({
  name, color, isModerator, position,
}: UserAvatarProps) {
  const initials = name.slice(0, 2);

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    flexShrink: 0,
  };

  const avatarStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: isModerator ? '6px' : '50%',
    backgroundColor: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  };

  const badgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '16px',
    height: '16px',
    lineHeight: '16px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  };

  return (
    <div style={containerStyles}>
      <div style={avatarStyles}>{initials}</div>
      <div style={badgeStyles}>{position}</div>
    </div>
  );
}

interface RaisedHandUserItemProps {
  user: RaisedHandUser;
  position: number;
  onLowerHand: (userId: string) => void;
  canLower: boolean;
  current: boolean;
  intl: IntlShape;
}

function RaisedHandUserItem({
  user, position, onLowerHand, canLower, current, intl,
}: RaisedHandUserItemProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const itemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  };

  const nameStyles: React.CSSProperties = {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const lowerHandButtonStyles: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  };

  const handleConfirmLowerHand = () => {
    onLowerHand(user.userId);
    setIsModalOpen(false);
  };

  return (
    <>
      <div style={itemStyles}>
        <UserAvatar
          name={user.name}
          color={user.color}
          isModerator={user.isModerator}
          position={position}
        />
        <span style={nameStyles}>{`${user.name} ${current ? `(${intl.formatMessage(intlMessages.raisedHandsDropdownYou)})` : ''}`}</span>
        {canLower && (
          <button
            style={lowerHandButtonStyles}
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            {intl.formatMessage(intlMessages.raisedHandsDropdownLower)}
          </button>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={intl.formatMessage(intlMessages.raisedHandsModalTitle)}
        size="sm"
        renderInPortal={false}
        intl={intl}
        footer={(
          <>
            <ModalButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              {intl.formatMessage(intlMessages.commonCancel)}
            </ModalButton>
            <ModalButton variant="danger" onClick={handleConfirmLowerHand}>
              {intl.formatMessage(intlMessages.commonConfirm)}
            </ModalButton>
          </>
        )}
      >
        {current ? (
          <p style={{ margin: 0 }}>
            {intl.formatMessage(intlMessages.raisedHandsModalConfirmCurrent)}
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            {intl.formatMessage(
              intlMessages.raisedHandsModalConfirm,
              { name: user.name },
            )}
          </p>
        )}
      </Modal>
    </>
  );
}

interface RaisedHandsListProps {
  users: RaisedHandUser[];
  onLowerHand: (userId: string) => void;
  currentUser: CurrentUserData;
  intl: IntlShape;
}

function RaisedHandsList({
  users, onLowerHand, currentUser, intl,
}: RaisedHandsListProps) {
  const containerStyles: React.CSSProperties = {
    minWidth: '200px',
    maxHeight: '70vh',
    overflowY: 'auto',
    padding: '0.5rem 1rem',
    color: '#fff',
  };

  const headerStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const listStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        {intl.formatMessage(intlMessages.raisedHandsDropdownTitle, { count: users.length })}
      </div>
      <div style={listStyles}>
        {users.map((user, index) => (
          <RaisedHandUserItem
            key={user.userId}
            user={user}
            position={index + 1}
            onLowerHand={onLowerHand}
            canLower={currentUser?.presenter || currentUser?.role === 'MODERATOR' || user.userId === currentUser?.userId}
            current={user.userId === currentUser?.userId}
            intl={intl}
          />
        ))}
      </div>
    </div>
  );
}

function RaisedHandsButtonComponent(
  { intl, pluginApi }: RaisedHandsButtonComponentProps,
): React.ReactNode {
  const {
    data: raisedHandUsers,
  } = pluginApi.useCustomSubscription!<RaisedHandUsersSubscriptionResponse>(RAISED_HAND_USERS);
  const { data: currentUser } = pluginApi.useCurrentUser();
  const raisedHandCount = raisedHandUsers?.user?.length ?? 0;
  const noRaisedHand = raisedHandCount === 0;
  const users = raisedHandUsers?.user ?? [];

  const [setRaiseHand] = pluginApi.useCustomMutation<{
    userId: string;
    raiseHand: boolean;
  }>(SET_RAISE_HAND);

  const lowerUserHand = (userId: string) => {
    setRaiseHand({
      variables: {
        userId,
        raiseHand: false,
      },
    });
  };

  const popoverContent = (
    <RaisedHandsList
      intl={intl}
      users={users}
      onLowerHand={lowerUserHand}
      currentUser={currentUser}
    />
  );

  const tooltipMessage = (() => {
    if (raisedHandCount > 1) {
      return intl.formatMessage(
        intlMessages.raisedHandsTooltipCountPlural,
        { count: raisedHandCount },
      );
    }
    if (raisedHandCount === 1) {
      return intl.formatMessage(
        intlMessages.raisedHandsTooltipCountSingular,
        { count: 1 },
      );
    }
    return intl.formatMessage(intlMessages.raisedHandsTooltipNone);
  })();

  if (noRaisedHand) {
    return (
      <Tooltip content={tooltipMessage}>
        <button
          className="media-btn"
          type="button"
          disabled={noRaisedHand}
          aria-label={tooltipMessage}
        >
          <span className="sr-only">
            {tooltipMessage}
          </span>
          <i className="icon-bbb-hand" />
        </button>
      </Tooltip>
    );
  }

  return (
    <Popover
      content={popoverContent}
      position="top"
      align="center"
    >
      {({
        disabled, onClick, ref,
      }) => (
        <Tooltip content={tooltipMessage}>
          {({
            children, styles, onBlur, onFocus, onMouseEnter, onMouseLeave,
          }) => (
            <button
              className="media-btn"
              type="button"
              ref={ref}
              style={styles}
              {...{
                disabled,
                onClick,
                onMouseEnter,
                onMouseLeave,
                onBlur,
                onFocus,
              }}
            >
              <span className="sr-only">
                {tooltipMessage}
              </span>
              <i className="icon-bbb-hand" />
              <div className="badge">
                <span>
                  {raisedHandCount}
                </span>
              </div>
              {children}
            </button>
          )}
        </Tooltip>
      )}
    </Popover>
  );
}

export default RaisedHandsButtonComponent;
