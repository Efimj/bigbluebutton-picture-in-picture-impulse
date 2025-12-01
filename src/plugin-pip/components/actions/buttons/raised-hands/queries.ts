export const RAISED_HAND_USERS = `
  subscription RaisedHandUsers {
    user_aggregate(
      where: {
        raiseHand: {_eq: true}
      },
      order_by: [
        {raiseHandTime: asc_nulls_last},
      ]
    ) {
      aggregate {
        count
      }
    }
  }
`;

export interface RaisedHandUsersSubscriptionResult {
  user_aggregate: {
    aggregate: {
      count: number;
    };
  };
}
