export const USER_SET_MUTED = `
  mutation UserSetMuted($userId: String, $muted: Boolean!) {
    userSetMuted(
      userId: $userId,
      muted: $muted
    )
  }
`;

export interface UserSetMutedMutationVariables {
  userId: string;
  muted: boolean;
}
