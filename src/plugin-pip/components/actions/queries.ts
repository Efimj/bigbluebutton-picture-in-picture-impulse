export const CURRENT_USER_QUERY = `
  subscription UserCurrent {
    user_current {
      voice {
        muted
        talking
        joined
        listenOnly
        listenOnlyInputDevice
      }
    }
  }
`;

export interface CurrentUserSubscriptionResult {
  user_current?: {
    voice: {
      muted: boolean;
      talking: boolean;
      joined: boolean;
      listenOnly: boolean;
      listenOnlyInputDevice: boolean;
    };
  }[];
}
