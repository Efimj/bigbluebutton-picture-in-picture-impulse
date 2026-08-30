export const CHATS_UNREAD = `
  subscription PipChatsUnread {
    chat {
      chatId
      totalUnread
    }
  }
`;

export interface ChatsUnreadSubscriptionResult {
  chat: {
    chatId: string;
    totalUnread: number;
  }[];
}
