import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import { Modal, ModalButton } from '../../../ui/modal';
import {
  MEETING_SET_MUTED,
  MeetingMutedVariables,
  SUBMIT_GUEST_APPROVAL_STATUS,
  GuestApprovalVariables,
  USER_EJECT_CAMERAS,
  USER_EJECT_FROM_MEETING,
  USER_EJECT_FROM_VOICE,
  USER_SET_LOCKED,
  USER_SET_MUTED,
  USER_SET_PRESENTER,
  USER_SET_RAISE_HAND,
  USER_SET_ROLE,
  UserEjectVariables,
  UserIdVariables,
  UserLockedVariables,
  UserMutedVariables,
  UserRaiseHandVariables,
  UserRoleVariables,
} from './mutations';
import {
  PARTICIPANTS_SUBSCRIPTION,
  ParticipantsSubscriptionResponse,
  Participant,
  WAITING_USERS_SUBSCRIPTION,
  WaitingUsersSubscriptionResponse,
  WaitingUser,
} from './queries';

const intlMessages = defineMessages({
  title: { id: 'plugin.users.panel.title', defaultMessage: 'Participants' },
  close: { id: 'plugin.users.panel.close', defaultMessage: 'Close participants' },
  search: { id: 'plugin.users.panel.search', defaultMessage: 'Search participants' },
  empty: { id: 'plugin.users.panel.empty', defaultMessage: 'No participants found' },
  waiting: { id: 'plugin.users.panel.waiting', defaultMessage: 'Waiting for approval' },
  admit: { id: 'plugin.users.panel.admit', defaultMessage: 'Admit' },
  deny: { id: 'plugin.users.panel.deny', defaultMessage: 'Deny' },
  admitAll: { id: 'plugin.users.panel.admitAll', defaultMessage: 'Admit all' },
  denyAll: { id: 'plugin.users.panel.denyAll', defaultMessage: 'Deny all' },
  you: { id: 'plugin.users.panel.you', defaultMessage: 'you' },
  moderator: { id: 'plugin.users.panel.moderator', defaultMessage: 'Moderator' },
  presenter: { id: 'plugin.users.panel.presenter', defaultMessage: 'Presenter' },
  guest: { id: 'plugin.users.panel.guest', defaultMessage: 'Guest' },
  actions: { id: 'plugin.users.panel.actions', defaultMessage: 'Quick actions' },
  mute: { id: 'plugin.users.panel.mute', defaultMessage: 'Mute' },
  unmute: { id: 'plugin.users.panel.unmute', defaultMessage: 'Unmute' },
  makePresenter: { id: 'plugin.users.panel.makePresenter', defaultMessage: 'Make presenter' },
  promote: { id: 'plugin.users.panel.promote', defaultMessage: 'Promote to moderator' },
  demote: { id: 'plugin.users.panel.demote', defaultMessage: 'Demote to viewer' },
  lock: { id: 'plugin.users.panel.lock', defaultMessage: 'Lock participant' },
  unlock: { id: 'plugin.users.panel.unlock', defaultMessage: 'Unlock participant' },
  stopCameras: { id: 'plugin.users.panel.stopCameras', defaultMessage: 'Stop cameras' },
  lowerHand: { id: 'plugin.users.panel.lowerHand', defaultMessage: 'Lower hand' },
  remove: { id: 'plugin.users.panel.remove', defaultMessage: 'Remove participant' },
  removeTitle: { id: 'plugin.users.panel.removeTitle', defaultMessage: 'Remove participant' },
  removeConfirm: {
    id: 'plugin.users.panel.removeConfirm',
    defaultMessage: 'Remove {name} from the meeting?',
  },
  preventRejoin: {
    id: 'plugin.users.panel.preventRejoin',
    defaultMessage: 'Prevent this participant from rejoining',
  },
  muteAll: {
    id: 'plugin.users.panel.muteAll',
    defaultMessage: 'Mute all except presenter',
  },
  noActions: { id: 'plugin.users.panel.noActions', defaultMessage: 'No available actions' },
  cancel: { id: 'plugin.common.cancel', defaultMessage: 'Cancel' },
  confirm: { id: 'plugin.common.confirm', defaultMessage: 'Confirm' },
});

interface UsersPanelProps {
  intl: IntlShape;
  pluginApi: PluginApi;
  onClose: () => void;
  actionsHeight: number;
}

interface ActionDefinition {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}

interface QuickActionButtonProps extends ActionDefinition {}

function QuickActionButton({
  label, icon, onClick, danger = false, id,
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      data-test={`pip-user-action-${id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 7px',
        borderRadius: '5px',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.14)'}`,
        backgroundColor: danger ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.07)',
        color: danger ? '#fca5a5' : '#fff',
        cursor: 'pointer',
        fontSize: '10px',
        lineHeight: 1.2,
      }}
    >
      <i className={`icon-bbb-${icon}`} />
      <span>{label}</span>
    </button>
  );
}

function getInitials(name: string): string {
  return name.trim().slice(0, 2) || '?';
}

function UsersPanel({
  intl, pluginApi, onClose, actionsHeight,
}: UsersPanelProps): React.ReactNode {
  const [search, setSearch] = React.useState('');
  const [expandedUserId, setExpandedUserId] = React.useState<string | null>(null);
  const [userToRemove, setUserToRemove] = React.useState<Participant | null>(null);
  const [banUser, setBanUser] = React.useState(false);

  const currentUserResponse = pluginApi.useCurrentUser();
  const currentUser = currentUserResponse?.data;
  const meetingResponse = pluginApi.useMeetingData!();
  const meeting = meetingResponse?.data;

  const { data: participantsData } = pluginApi
    .useCustomSubscription!<ParticipantsSubscriptionResponse>(PARTICIPANTS_SUBSCRIPTION);
  const { data: waitingUsersData } = pluginApi
    .useCustomSubscription!<WaitingUsersSubscriptionResponse>(WAITING_USERS_SUBSCRIPTION);

  const [submitGuestApproval] = pluginApi
    .useCustomMutation!<GuestApprovalVariables>(SUBMIT_GUEST_APPROVAL_STATUS);
  const [setUserMuted] = pluginApi.useCustomMutation!<UserMutedVariables>(USER_SET_MUTED);
  const [setMeetingMuted] = pluginApi
    .useCustomMutation!<MeetingMutedVariables>(MEETING_SET_MUTED);
  const [setPresenter] = pluginApi.useCustomMutation!<UserIdVariables>(USER_SET_PRESENTER);
  const [setRole] = pluginApi.useCustomMutation!<UserRoleVariables>(USER_SET_ROLE);
  const [setLocked] = pluginApi.useCustomMutation!<UserLockedVariables>(USER_SET_LOCKED);
  const [ejectCameras] = pluginApi.useCustomMutation!<UserIdVariables>(USER_EJECT_CAMERAS);
  const [setRaiseHand] = pluginApi
    .useCustomMutation!<UserRaiseHandVariables>(USER_SET_RAISE_HAND);
  const [ejectFromMeeting] = pluginApi
    .useCustomMutation!<UserEjectVariables>(USER_EJECT_FROM_MEETING);
  const [ejectFromVoice] = pluginApi
    .useCustomMutation!<UserEjectVariables>(USER_EJECT_FROM_VOICE);

  const participants = participantsData?.user ?? [];
  const waitingUsers = waitingUsersData?.user_guest ?? [];
  const isModerator = currentUser?.role === 'MODERATOR';
  const isBreakout = Boolean(meeting?.isBreakout);
  const usersPolicies = meeting?.usersPolicies;
  const lockSettings = meeting?.lockSettings;
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleParticipants = normalizedSearch
    ? participants.filter((user) => user.name.toLocaleLowerCase().includes(normalizedSearch))
    : participants;

  React.useEffect(() => {
    if (expandedUserId && !participants.some((user) => user.userId === expandedUserId)) {
      setExpandedUserId(null);
    }
  }, [expandedUserId, participants]);

  const submitGuestStatus = (
    users: WaitingUser[],
    status: 'ALLOW' | 'DENY',
  ) => {
    if (!submitGuestApproval || users.length === 0) return;
    submitGuestApproval({
      variables: {
        guests: users.map((user) => ({ guest: user.userId, status })),
      },
    });
  };

  const confirmRemoveUser = () => {
    if (!userToRemove) return;
    const variables = { userId: userToRemove.userId, banUser };

    if (userToRemove.userId.startsWith('v_')) {
      ejectFromVoice?.({ variables });
    } else {
      ejectFromMeeting?.({ variables });
    }

    setUserToRemove(null);
    setBanUser(false);
  };

  const getActions = (user: Participant): ActionDefinition[] => {
    const actions: ActionDefinition[] = [];
    const isCurrentUser = user.userId === currentUser?.userId;
    const { voice } = user;
    const isInAudio = Boolean(voice?.joined && !voice?.deafened);
    const isListenOnly = Boolean(voice?.listenOnly || voice?.listenOnlyInputDevice);
    const hasAuthority = isModerator || isCurrentUser;

    if (hasAuthority && isInAudio && !isListenOnly && !isBreakout) {
      if (!voice?.muted) {
        actions.push({
          id: 'mute',
          label: intl.formatMessage(intlMessages.mute),
          icon: 'unmute',
          onClick: () => setUserMuted?.({ variables: { userId: user.userId, muted: true } }),
        });
      } else if (isCurrentUser || (isModerator && usersPolicies?.allowModsToUnmuteUsers)) {
        actions.push({
          id: 'unmute',
          label: intl.formatMessage(intlMessages.unmute),
          icon: 'mute',
          onClick: () => setUserMuted?.({ variables: { userId: user.userId, muted: false } }),
        });
      }
    }

    if (user.raiseHand && (isModerator || isCurrentUser)) {
      actions.push({
        id: 'lower-hand',
        label: intl.formatMessage(intlMessages.lowerHand),
        icon: 'hand',
        onClick: () => setRaiseHand?.({
          variables: { userId: user.userId, raiseHand: false },
        }),
      });
    }

    if (isModerator && !user.presenter && !user.bot && !user.isDialIn) {
      actions.push({
        id: 'presenter',
        label: intl.formatMessage(intlMessages.makePresenter),
        icon: 'presentation',
        onClick: () => setPresenter?.({ variables: { userId: user.userId } }),
      });
    }

    if (!isModerator || isCurrentUser) return actions;

    const canChangeRole = !isBreakout
      && !user.bot
      && !user.isDialIn
      && !(user.guest
        && usersPolicies?.authenticatedGuest
        && !usersPolicies?.allowPromoteGuestToModerator);

    if (canChangeRole) {
      actions.push(user.isModerator ? {
        id: 'demote',
        label: intl.formatMessage(intlMessages.demote),
        icon: 'user',
        onClick: () => setRole?.({
          variables: { userId: user.userId, role: 'VIEWER' },
        }),
      } : {
        id: 'promote',
        label: intl.formatMessage(intlMessages.promote),
        icon: 'promote',
        onClick: () => setRole?.({
          variables: { userId: user.userId, role: 'MODERATOR' },
        }),
      });
    }

    if (!user.isModerator && !user.bot && lockSettings?.hasActiveLockSetting) {
      actions.push({
        id: user.locked ? 'unlock' : 'lock',
        label: intl.formatMessage(user.locked ? intlMessages.unlock : intlMessages.lock),
        icon: user.locked ? 'unlock' : 'lock',
        onClick: () => setLocked?.({
          variables: { userId: user.userId, locked: !user.locked },
        }),
      });
    }

    if (usersPolicies?.allowModsToEjectCameras && user.cameras.length > 0) {
      actions.push({
        id: 'stop-cameras',
        label: intl.formatMessage(intlMessages.stopCameras),
        icon: 'video_off',
        onClick: () => ejectCameras?.({ variables: { userId: user.userId } }),
      });
    }

    actions.push({
      id: 'remove',
      label: intl.formatMessage(intlMessages.remove),
      icon: 'circle_close',
      danger: true,
      onClick: () => {
        setBanUser(false);
        setUserToRemove(user);
      },
    });

    return actions;
  };

  const renderRoleBadge = (label: string, color: string) => (
    <span style={{
      padding: '1px 4px',
      borderRadius: '3px',
      backgroundColor: color,
      color: '#fff',
      fontSize: '8px',
      fontWeight: 700,
      lineHeight: 1.4,
    }}
    >
      {label}
    </span>
  );

  return (
    <div
      data-test="pip-participants-panel"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: actionsHeight,
        backgroundColor: 'rgba(20,20,20,0.98)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '6px 9px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
      }}
      >
        <i className="icon-bbb-user_list" />
        <strong style={{ fontSize: '12px', flex: 1 }}>
          {intl.formatMessage(intlMessages.title)}
          {' '}
          (
          {participants.length}
          )
        </strong>
        {isModerator && !isBreakout && (
          <button
            type="button"
            onClick={() => setMeetingMuted?.({
              variables: { muted: true, exceptPresenter: true },
            })}
            title={intl.formatMessage(intlMessages.muteAll)}
            style={{
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.07)',
              color: '#fff',
              cursor: 'pointer',
              padding: '3px 6px',
              fontSize: '10px',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <i className="icon-bbb-mute" />
            {' '}
            {intl.formatMessage(intlMessages.muteAll)}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={intl.formatMessage(intlMessages.close)}
          style={{
            background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '18px', padding: '0 3px',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '5px 8px', flexShrink: 0 }}>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={intl.formatMessage(intlMessages.search)}
          aria-label={intl.formatMessage(intlMessages.search)}
          style={{
            width: '100%',
            height: '28px',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '5px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: '#fff',
            padding: '0 8px',
            fontSize: '11px',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 7px' }}>
        {isModerator && waitingUsers.length > 0 && (
          <section style={{
            marginBottom: '7px',
            padding: '6px',
            border: '1px solid rgba(245,158,11,0.45)',
            borderRadius: '6px',
            backgroundColor: 'rgba(245,158,11,0.09)',
          }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px',
            }}
            >
              <strong style={{ color: '#fbbf24', fontSize: '10px', flex: 1 }}>
                {intl.formatMessage(intlMessages.waiting)}
                {' '}
                (
                {waitingUsers.length}
                )
              </strong>
              <button
                type="button"
                onClick={() => submitGuestStatus(waitingUsers, 'ALLOW')}
                style={{
                  border: 'none', borderRadius: '4px', background: '#16a34a', color: '#fff', fontSize: '9px', padding: '3px 6px', cursor: 'pointer',
                }}
              >
                {intl.formatMessage(intlMessages.admitAll)}
              </button>
              <button
                type="button"
                onClick={() => submitGuestStatus(waitingUsers, 'DENY')}
                style={{
                  border: 'none', borderRadius: '4px', background: '#dc2626', color: '#fff', fontSize: '9px', padding: '3px 6px', cursor: 'pointer',
                }}
              >
                {intl.formatMessage(intlMessages.denyAll)}
              </button>
            </div>
            {waitingUsers.map((waitingUser) => {
              const name = waitingUser.user?.name || waitingUser.userId;
              return (
                <div
                  key={waitingUser.userId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 0',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', backgroundColor: waitingUser.user?.color || '#6b7280', display: 'grid', placeItems: 'center', fontSize: '9px', fontWeight: 700,
                  }}
                  >
                    {getInitials(name)}
                  </div>
                  <span style={{
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px',
                  }}
                  >
                    {name}
                  </span>
                  <button
                    type="button"
                    onClick={() => submitGuestStatus([waitingUser], 'ALLOW')}
                    aria-label={`${intl.formatMessage(intlMessages.admit)} ${name}`}
                    title={intl.formatMessage(intlMessages.admit)}
                    style={{
                      border: 'none',
                      borderRadius: '4px',
                      background: '#15803d',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '9px',
                      fontWeight: 600,
                      lineHeight: 1.2,
                      padding: '4px 7px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {intl.formatMessage(intlMessages.admit)}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitGuestStatus([waitingUser], 'DENY')}
                    aria-label={`${intl.formatMessage(intlMessages.deny)} ${name}`}
                    title={intl.formatMessage(intlMessages.deny)}
                    style={{
                      border: 'none',
                      borderRadius: '4px',
                      background: '#b91c1c',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '9px',
                      fontWeight: 600,
                      lineHeight: 1.2,
                      padding: '4px 7px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {intl.formatMessage(intlMessages.deny)}
                  </button>
                </div>
              );
            })}
          </section>
        )}

        {visibleParticipants.length === 0 && (
          <div style={{
            textAlign: 'center', color: '#777', fontSize: '11px', padding: '14px',
          }}
          >
            {intl.formatMessage(intlMessages.empty)}
          </div>
        )}

        {visibleParticipants.map((user) => {
          const expanded = expandedUserId === user.userId;
          const actions = getActions(user);
          const isCurrentUser = user.userId === currentUser?.userId;
          return (
            <div
              key={user.userId}
              data-test="pip-participant"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: '7px', minHeight: '38px', padding: '4px 2px',
              }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: user.isModerator ? '6px' : '50%',
                  backgroundColor: user.color || '#6b7280',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  fontSize: '10px',
                  fontWeight: 700,
                  border: user.presenter ? '2px solid #60a5fa' : '2px solid transparent',
                }}
                >
                  {getInitials(user.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                    }}
                    >
                      {user.name}
                      {isCurrentUser && ` (${intl.formatMessage(intlMessages.you)})`}
                    </span>
                    {user.isModerator && renderRoleBadge(intl.formatMessage(intlMessages.moderator), '#2563eb')}
                    {user.presenter && renderRoleBadge(intl.formatMessage(intlMessages.presenter), '#7c3aed')}
                    {user.guest && renderRoleBadge(intl.formatMessage(intlMessages.guest), '#b45309')}
                  </div>
                  <div style={{
                    display: 'flex', gap: '6px', color: '#8b8b8b', fontSize: '9px', marginTop: '1px',
                  }}
                  >
                    {user.voice?.joined && (
                      <span title={user.voice.muted
                        ? intl.formatMessage(intlMessages.mute)
                        : intl.formatMessage(intlMessages.unmute)}
                      >
                        <i className={`icon-bbb-${user.voice.muted ? 'mute' : 'unmute'}`} />
                      </span>
                    )}
                    {user.cameras.length > 0 && <i className="icon-bbb-video" />}
                    {user.raiseHand && <span>✋</span>}
                    {user.locked && <i className="icon-bbb-lock" />}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedUserId(expanded ? null : user.userId)}
                  aria-expanded={expanded}
                  aria-label={`${intl.formatMessage(intlMessages.actions)}: ${user.name}`}
                  title={intl.formatMessage(intlMessages.actions)}
                  style={{
                    width: '25px', height: '25px', border: 'none', borderRadius: '50%', backgroundColor: expanded ? 'rgba(59,130,246,0.3)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '16px', lineHeight: 1,
                  }}
                >
                  ⋯
                </button>
              </div>
              {expanded && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 2px 7px 35px',
                }}
                >
                  {actions.length > 0
                    ? actions.map((action) => <QuickActionButton key={action.id} {...action} />)
                    : (
                      <span style={{ color: '#777', fontSize: '9px' }}>
                        {intl.formatMessage(intlMessages.noActions)}
                      </span>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        intl={intl}
        isOpen={Boolean(userToRemove)}
        onClose={() => {
          setUserToRemove(null);
          setBanUser(false);
        }}
        title={intl.formatMessage(intlMessages.removeTitle)}
        size="sm"
        footer={(
          <>
            <ModalButton variant="secondary" onClick={() => setUserToRemove(null)}>
              {intl.formatMessage(intlMessages.cancel)}
            </ModalButton>
            <ModalButton variant="danger" onClick={confirmRemoveUser}>
              {intl.formatMessage(intlMessages.confirm)}
            </ModalButton>
          </>
        )}
      >
        <p style={{ marginTop: 0 }}>
          {intl.formatMessage(intlMessages.removeConfirm, { name: userToRemove?.name || '' })}
        </p>
        <label
          htmlFor="pip-prevent-user-rejoin"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
          }}
        >
          <input
            id="pip-prevent-user-rejoin"
            type="checkbox"
            checked={banUser}
            onChange={(event) => setBanUser(event.target.checked)}
          />
          {intl.formatMessage(intlMessages.preventRejoin)}
        </label>
      </Modal>
    </div>
  );
}

export default UsersPanel;
