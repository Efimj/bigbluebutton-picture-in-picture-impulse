export const VIDEO_STREAMS_SUBSCRIPTION = `
  subscription VideoStreams {
    user_camera {
      streamId
      user {
        name
        userId
      }
    }
  }
`;

export interface VideoStreamsSubscriptionResult {
  user_camera?: {
    streamId: string
    user: {
      name: string
      userId: string
    };
  }[];
}
