export const SET_RAISE_HAND = `
  mutation SetRaiseHand($userId: String!, $raiseHand: Boolean!) {
    userSetRaiseHand(
      userId: $userId,
      raiseHand: $raiseHand,
    )
  }
`;
