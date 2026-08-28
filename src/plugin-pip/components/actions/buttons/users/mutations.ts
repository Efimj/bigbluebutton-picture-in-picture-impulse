export const SUBMIT_GUEST_APPROVAL_STATUS = `
  mutation SubmitGuestApprovalStatus($guests: [GuestUserApprovalStatus]!) {
    guestUsersSubmitApprovalStatus(guests: $guests)
  }
`;

export const USER_SET_MUTED = `
  mutation UserSetMuted($userId: String, $muted: Boolean!) {
    userSetMuted(userId: $userId, muted: $muted)
  }
`;

export const MEETING_SET_MUTED = `
  mutation SetMeetingMuted($muted: Boolean!, $exceptPresenter: Boolean!) {
    meetingSetMuted(muted: $muted, exceptPresenter: $exceptPresenter)
  }
`;

export const USER_SET_PRESENTER = `
  mutation SetPresenter($userId: String!) {
    userSetPresenter(userId: $userId)
  }
`;

export const USER_SET_ROLE = `
  mutation SetRole($userId: String!, $role: String!) {
    userSetRole(userId: $userId, role: $role)
  }
`;

export const USER_SET_LOCKED = `
  mutation SetUserLocked($userId: String!, $locked: Boolean!) {
    userSetLocked(userId: $userId, locked: $locked)
  }
`;

export const USER_EJECT_CAMERAS = `
  mutation UserEjectCameras($userId: String!) {
    userEjectCameras(userId: $userId)
  }
`;

export const USER_SET_RAISE_HAND = `
  mutation SetRaiseHand($userId: String!, $raiseHand: Boolean!) {
    userSetRaiseHand(userId: $userId, raiseHand: $raiseHand)
  }
`;

export const USER_EJECT_FROM_MEETING = `
  mutation EjectFromMeeting($userId: String!, $banUser: Boolean!) {
    userEjectFromMeeting(userId: $userId, banUser: $banUser)
  }
`;

export const USER_EJECT_FROM_VOICE = `
  mutation EjectFromVoice($userId: String!, $banUser: Boolean!) {
    userEjectFromVoice(userId: $userId, banUser: $banUser)
  }
`;

export interface GuestApprovalVariables {
  guests: Array<{ guest: string; status: 'ALLOW' | 'DENY' }>;
}

export interface UserMutedVariables {
  userId: string;
  muted: boolean;
}

export interface MeetingMutedVariables {
  muted: boolean;
  exceptPresenter: boolean;
}

export interface UserIdVariables {
  userId: string;
}

export interface UserRoleVariables extends UserIdVariables {
  role: 'MODERATOR' | 'VIEWER';
}

export interface UserLockedVariables extends UserIdVariables {
  locked: boolean;
}

export interface UserRaiseHandVariables extends UserIdVariables {
  raiseHand: boolean;
}

export interface UserEjectVariables extends UserIdVariables {
  banUser: boolean;
}
