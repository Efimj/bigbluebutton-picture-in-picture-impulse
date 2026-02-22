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

export const USER_NAMES_SUBSCRIPTION = `
  subscription UsersNames {
    user(order_by: { name: asc }) {
      name
      userId
    }
  }
`;

export interface UsersNamesSubscriptionResponse {
  user: Array<{
    name: string;
    userId: string;
  }>;
}
