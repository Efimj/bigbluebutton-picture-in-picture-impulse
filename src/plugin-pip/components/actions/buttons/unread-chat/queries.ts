export const PUBLIC_CHAT = `
  subscription PublicChat {
    chat(where: {public: {_eq: true}}) {
      totalUnread
    }
  }
`;

export interface PublicChatSubscriptionResult {
  chat: {
    totalUnread: number;
  }[];
}
