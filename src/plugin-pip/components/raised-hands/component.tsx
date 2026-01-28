import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import { RAISED_HAND_USERS, RaisedHandUserSubscriptionResponse } from './queries';
import { SET_RAISE_HAND } from './mutations';
import { useToast } from '../ui/toast';
import { Modal, ModalButton } from '../ui/modal';

export const intlMessages = defineMessages({
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
});

interface RaisedHandNotifierProps {
  intl: IntlShape;
  pluginApi: PluginApi;
}

interface UserAvatarProps {
  name: string;
  color: string;
  isModerator: boolean;
}

function UserAvatar({ name, color, isModerator }: UserAvatarProps) {
  const initials = name.slice(0, 2);

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
    flexShrink: 0,
    textTransform: 'capitalize',
  };

  return <div style={avatarStyles}>{initials}</div>;
}

interface RaisedHandContentProps {
  user: {
    name: string;
    color: string;
    isModerator: boolean;
    raiseHandTime: string;
    userId: string;
  };
  lowerUserHands: (userId: string, userName: string) => void;
  intl: IntlShape;
}

function RaisedHandContent({ intl, user, lowerUserHands }: RaisedHandContentProps) {
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  };

  const textContainerStyles: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
  };

  const nameStyles: React.CSSProperties = {
    fontWeight: 600,
  };

  const lowerHandButtonStyles: React.CSSProperties = {
    marginTop: '12px',
    padding: '6px 14px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
    width: '100%',
  };

  return (
    <div>
      <div style={headerStyles}>
        <UserAvatar name={user.name} color={user.color} isModerator={user.isModerator} />
        <div style={textContainerStyles}>
          <span style={nameStyles}>{user.name}</span>
          &nbsp;
          <span>{intl.formatMessage(intlMessages.raisedHandsStatus)}</span>
        </div>
      </div>
      <button
        style={lowerHandButtonStyles}
        type="button"
        onClick={() => lowerUserHands(user.userId, user.name)}
      >
        {intl.formatMessage(intlMessages.raisedHandsLowerHand)}
      </button>
    </div>
  );
}

function RaisedHandNotifier({ intl, pluginApi }: RaisedHandNotifierProps): React.ReactNode {
  const {
    data: raisedHandUsersData,
  } = pluginApi.useCustomSubscription!<RaisedHandUserSubscriptionResponse>(RAISED_HAND_USERS);
  const raisedHands = raisedHandUsersData?.user ?? [];
  const { showToast, hideToast, toasts } = useToast();
  const previousRaisedHandsRef = React.useRef<Set<string>>(new Set());
  const [
    userToLowerHand,
    setUserToLowerHand,
  ] = React.useState<{ userId: string; userName: string } | null>(null);

  const [setRaiseHand] = pluginApi.useCustomMutation<{
    userId: string;
    raiseHand: boolean;
  }>(SET_RAISE_HAND);

  const lowerUserHands = (userId: string) => {
    setRaiseHand({
      variables: {
        userId,
        raiseHand: false,
      },
    });
    const toastToRemove = toasts.find((toast) => toast.id.includes(userId));
    if (toastToRemove) {
      hideToast(toastToRemove.id);
    }
  };

  React.useEffect(() => {
    const currentRaisedHandIds = new Set(raisedHands.map((user) => user.userId));
    const previousRaisedHandIds = previousRaisedHandsRef.current;

    // Find new raised hands
    const newRaisedHands = raisedHands.filter(
      (user) => !previousRaisedHandIds.has(user.userId),
    );

    // Find removed raised hands
    const removedUserIds = Array.from(previousRaisedHandIds).filter(
      (userId) => !currentRaisedHandIds.has(userId),
    );

    // Show toasts for new raised hands
    newRaisedHands.forEach((user) => {
      showToast(
        <RaisedHandContent
          intl={intl}
          user={user}
          lowerUserHands={(userId, userName) => setUserToLowerHand({ userId, userName })}
        />,
        'default',
        10000, // 10 seconds duration
        true, // Dismissible by user
        user.userId,
      );
    });

    // Hide toasts for users who lowered their hands
    removedUserIds.forEach((userId) => {
      // Find and remove the corresponding toast
      const toastToRemove = toasts.find((toast) => toast.id.includes(userId));
      if (toastToRemove) {
        hideToast(toastToRemove.id);
      }
    });

    previousRaisedHandsRef.current = currentRaisedHandIds;
  }, [raisedHands, showToast, hideToast, toasts]);

  const handleConfirmLowerHand = () => {
    lowerUserHands(userToLowerHand.userId);
    setUserToLowerHand(null);
  };

  return (
    <Modal
      intl={intl}
      isOpen={userToLowerHand !== null}
      onClose={() => setUserToLowerHand(null)}
      title={intl.formatMessage(intlMessages.raisedHandsModalTitle)}
      size="sm"
      footer={(
        <>
          <ModalButton variant="secondary" onClick={() => setUserToLowerHand(null)}>
            {intl.formatMessage(intlMessages.commonCancel)}
          </ModalButton>
          <ModalButton variant="danger" onClick={handleConfirmLowerHand}>
            {intl.formatMessage(intlMessages.commonConfirm)}
          </ModalButton>
        </>
      )}
    >
      <p style={{ margin: 0 }}>
        {intl.formatMessage(
          intlMessages.raisedHandsModalConfirm,
          { name: userToLowerHand?.userName },
        )}
      </p>
    </Modal>
  );
}

export default RaisedHandNotifier;
