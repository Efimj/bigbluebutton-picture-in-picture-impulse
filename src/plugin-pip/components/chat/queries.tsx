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
  message: string;
  messageAsHtml: string;
  messageId: string;
  createdAt: string;
  messageMetadata: string | null;
  senderName: string | null;
  senderRole: string | null;
  senderId: string | null;
}

export interface ChatMessageStreamResponse {
  chat_message_stream: Array<Message>;
}

export const CHAT_ALL_MESSAGES_SUBSCRIPTION = `
  subscription ChatAllMessages {
    chat_message(
      where: { chat: { public: { _eq: true } } }
      order_by: { createdAt: asc }
    ) {
      chatId
      createdAt
      message
      messageAsHtml
      messageId
      messageType
      senderName
      senderRole
      senderId
    }
  }
`;

// Fallback for BBB deployments where filtering through chat.public
// returns an empty set in plugin context.
export const CHAT_ALL_MESSAGES_FALLBACK_SUBSCRIPTION = `
  subscription ChatAllMessagesFallback {
    chat_message(
      order_by: { createdAt: asc }
    ) {
      chatId
      createdAt
      message
      messageAsHtml
      messageId
      messageType
      senderName
      senderRole
      senderId
    }
  }
`;

export interface ChatAllMessagesResponse {
  chat_message: Array<Omit<Message, 'messageMetadata'>>;
}
