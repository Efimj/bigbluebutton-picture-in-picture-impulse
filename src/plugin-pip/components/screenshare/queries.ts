export const SCREENSHARE = `
  subscription Screenshare {
    screenshare {
      stream
    }
  }
`;

export interface ScreenshareSubscriptionResult {
  screenshare: {
    stream: string;
  }[];
}
