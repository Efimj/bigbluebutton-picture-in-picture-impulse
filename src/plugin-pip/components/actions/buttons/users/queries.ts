export const USER_AGGREGATE_COUNT_SUBSCRIPTION = `
  subscription UsersCount {
    user_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export interface UsersCountSubscriptionResponse {
  user_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export const WAITING_USERS_SUBSCRIPTION = `
  subscription WaitingUsers {
    user_guest(where: { isWaiting: { _eq: true } }) {
      userId
      guestLobbyMessage
      isAllowed
      isDenied
      user {
        userId
        name
        color
        role
        avatar
        authed
      }
    }
  }
`;

export interface WaitingUser {
  userId: string;
  guestLobbyMessage?: string | null;
  isAllowed?: boolean;
  isDenied?: boolean;
  user?: {
    userId: string;
    name: string;
    color: string;
    role: string;
    avatar?: string;
    authed?: boolean;
  };
}

export interface WaitingUsersSubscriptionResponse {
  user_guest: WaitingUser[];
}

export const PARTICIPANTS_SUBSCRIPTION = `
  subscription PipParticipants {
    user(
      order_by: [
        { presenter: desc }
        { role: asc }
        { nameSortable: asc }
        { registeredAt: asc }
      ]
    ) {
      userId
      name
      role
      isModerator
      presenter
      color
      avatar
      guest
      bot
      isDialIn
      locked
      raiseHand
      cameras {
        streamId
      }
      voice {
        joined
        muted
        deafened
        listenOnly
        listenOnlyInputDevice
      }
    }
  }
`;

export interface Participant {
  userId: string;
  name: string;
  role: string;
  isModerator: boolean;
  presenter: boolean;
  color: string;
  avatar?: string;
  guest: boolean;
  bot: boolean;
  isDialIn: boolean;
  locked: boolean;
  raiseHand: boolean;
  cameras: Array<{ streamId: string }>;
  voice?: {
    joined: boolean;
    muted: boolean;
    deafened: boolean;
    listenOnly: boolean;
    listenOnlyInputDevice: boolean;
  };
}

export interface ParticipantsSubscriptionResponse {
  user: Participant[];
}
