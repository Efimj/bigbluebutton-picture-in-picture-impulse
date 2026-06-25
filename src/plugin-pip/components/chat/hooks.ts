import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import {
  CHAT_MESSAGE_STREAM,
  ChatMessage,
  ChatMessageStreamResponse,
  getChatMessageKey,
  Message,
  sortChatMessages,
} from './queries';

interface ChatMessageStreamState {
  latestStreamMessages: Message[];
  streamMessages: ChatMessage[];
}

export function useChatMessageStream(pluginApi: PluginApi): ChatMessageStreamState {
  const streamCursorRef = React.useRef(new Date().toISOString());
  const [streamMessages, setStreamMessages] = React.useState<ChatMessage[]>([]);

  const { data: streamData } = pluginApi.useCustomSubscription!<ChatMessageStreamResponse>(
    CHAT_MESSAGE_STREAM,
    {
      variables: {
        createdAt: streamCursorRef.current,
      },
    },
  );

  const latestStreamMessages = streamData?.chat_message_stream ?? [];

  React.useEffect(() => {
    if (!latestStreamMessages.length) return;

    setStreamMessages((prev) => {
      const byId = new Map<string, ChatMessage>();
      let changed = false;

      prev.forEach((msg) => {
        byId.set(getChatMessageKey(msg), msg);
      });

      latestStreamMessages.forEach((msg) => {
        const key = getChatMessageKey(msg);
        if (!byId.has(key)) changed = true;
        byId.set(key, msg);
      });

      if (!changed) return prev;

      return sortChatMessages(Array.from(byId.values()));
    });
  }, [latestStreamMessages]);

  return React.useMemo(
    () => ({
      latestStreamMessages,
      streamMessages,
    }),
    [latestStreamMessages, streamMessages],
  );
}
