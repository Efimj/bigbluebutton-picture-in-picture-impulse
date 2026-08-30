export const CHAT_MESSAGE_STREAM = `
  subscription getChatMessageStream($createdAt: timestamptz!) {
    chat_message_stream(
      cursor: { initial_value: { createdAt: $createdAt }, ordering: ASC},
      batch_size: 10
    ) {
      chatId
      createdAt
      message
      messageAsHtml
      messageId
      messageMetadata
      messageType
      senderName
      senderRole
      senderId
    }
  }
`;

export interface Message {
  messageType: string;
  chatId: string;
  message: string | null;
  messageAsHtml: string | null;
  messageId: string;
  createdAt: string;
  messageMetadata: string | null;
  senderName: string | null;
  senderRole: string | null;
  senderId: string | null;
}

export type ChatMessage = Omit<Message, 'messageMetadata'> | Message;

export const getChatMessageKey = (msg: ChatMessage): string => {
  // The history views and chat_message_stream can serialize the same message
  // differently (most notably messageAsHtml). messageId is the database primary
  // key, so including presentation fields in the key makes one message appear
  // twice when history and the live stream are merged.
  if (msg.messageId) return `${msg.chatId}|${msg.messageId}`;

  // Keep a deterministic fallback for legacy/system events without messageId.
  return [
    msg.chatId || '',
    msg.createdAt || '',
    msg.senderId || msg.senderName || '',
    msg.message || msg.messageAsHtml || '',
    msg.messageType || '',
  ].join('|');
};

export const sortChatMessages = <T extends ChatMessage>(messages: T[]): T[] => (
  [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
);

export interface ChatMessageStreamResponse {
  chat_message_stream: Array<Message>;
}

export const CHAT_PUBLIC_HISTORY_SUBSCRIPTION = `
  subscription PipPublicChatHistory {
    chat_message_public(order_by: { createdAt: asc }) {
      chatId
      createdAt
      message
      messageAsHtml
      messageId
      messageMetadata
      messageType
      senderName
      senderRole
      senderId
    }
  }
`;

export const CHAT_PRIVATE_HISTORY_SUBSCRIPTION = `
  subscription PipPrivateChatHistory($chatId: String!) {
    chat_message_private(
      where: { chatId: { _eq: $chatId } }
      order_by: { createdAt: asc }
    ) {
      chatId
      createdAt
      message
      messageAsHtml
      messageId
      messageMetadata
      messageType
      senderName
      senderRole
      senderId
    }
  }
`;

export interface ChatAllMessagesResponse {
  chat_message_public?: Message[];
  chat_message_private?: Message[];
}

export const CHATS_SUBSCRIPTION = `
  subscription PipChats {
    chat(order_by: { chatId: asc }) {
      chatId
      public
      totalMessages
      totalUnread
      lastSeenAt
      participant {
        userId
        name
        currentlyInMeeting
      }
    }
  }
`;

export interface ChatSummary {
  chatId: string;
  public: boolean;
  totalMessages: number;
  totalUnread: number;
  lastSeenAt: string;
  participant?: {
    userId: string;
    name: string;
    currentlyInMeeting: boolean;
  } | null;
}

export interface ChatsSubscriptionResponse {
  chat: ChatSummary[];
}

export const CHAT_SET_LAST_SEEN = `
  mutation UpdateChatLastSeen($chatId: String, $lastSeenAt: String) {
    chatSetLastSeen(
      chatId: $chatId
      lastSeenAt: $lastSeenAt
    )
  }
`;

export interface ChatSetLastSeenVariables {
  chatId: string;
  lastSeenAt: string;
}
