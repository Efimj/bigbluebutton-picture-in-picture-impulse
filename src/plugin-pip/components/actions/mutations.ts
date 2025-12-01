export const USER_SET_MUTED = `
  mutation UserSetMuted($userId: String, $muted: Boolean!) {
    userSetMuted(
      userId: $userId,
      muted: $muted
    )
  }
`;

export const CAMERA_BROADCAST_STOP = `
  mutation CameraBroadcastStop($cameraId: String!) {
    cameraBroadcastStop(
      stream: $cameraId
    )
  }
`;

export interface UserSetMutedMutationVariables {
  userId: string;
  muted: boolean;
}

export interface CameraBroadcastStopMutationVariables {
  cameraId: string;
}
