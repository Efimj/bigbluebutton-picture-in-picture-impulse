import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';
import CamerasComponent from './components/cameras/component';
import ActionsComponent from './components/actions/component';
import ScreenshareComponent from './components/screenshare/component';
import ChatNotifier from './components/chat/notifier';
import ChatPanel from './components/chat/panel';
import UsersPanel from './components/actions/buttons/users/panel';
import RaisedHandNotifier from './components/raised-hands/component';
import { ToastProvider } from './components/ui/toast';
import { useChatMessageStream } from './components/chat/hooks';
import {
  CHATS_SUBSCRIPTION,
  ChatMessage,
  ChatsSubscriptionResponse,
} from './components/chat/queries';
import { useScreenshare } from './components/screenshare/hooks';
import { PipWindowProvider } from './components/contexts/pip-window';
import { LayoutProvider, useLayoutContext } from './components/contexts/layout';

interface PluginPipProps {
  intl: IntlShape
  pluginApi: PluginApi;
  pipWindow: Window;
}

interface PluginPipInnerProps {
  intl: IntlShape;
  pluginApi: PluginApi;
  streamMessages: ChatMessage[];
}

function PluginPipInner({
  intl, pluginApi, streamMessages,
}: PluginPipInnerProps): React.ReactNode {
  const [openPanel, setOpenPanel] = React.useState<'chat' | 'users' | null>(null);
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
  const [pendingPrivateChat, setPendingPrivateChat] = React.useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const { actions } = useLayoutContext();
  const { data: chatsData } = pluginApi
    .useCustomSubscription!<ChatsSubscriptionResponse>(CHATS_SUBSCRIPTION);
  const chats = chatsData?.chat ?? [];
  const publicChat = chats.find((chat) => chat.public);
  const pendingResolvedChat = pendingPrivateChat
    ? chats.find((chat) => !chat.public
      && chat.participant?.userId === pendingPrivateChat.userId)
    : undefined;
  const selectedChat = pendingPrivateChat
    ? pendingResolvedChat
    : (chats.find((chat) => chat.chatId === selectedChatId) || publicChat);

  React.useEffect(() => {
    if (!pendingResolvedChat) return;
    setSelectedChatId(pendingResolvedChat.chatId);
    setPendingPrivateChat(null);
  }, [pendingResolvedChat]);

  const openPrivateChat = (userId: string, userName: string) => {
    const existingChat = chats.find((chat) => (
      !chat.public && chat.participant?.userId === userId
    ));

    if (existingChat) {
      setSelectedChatId(existingChat.chatId);
      setPendingPrivateChat(null);
    } else {
      setSelectedChatId(null);
      setPendingPrivateChat({ userId, userName });
      pluginApi.serverCommands?.chat?.createPrivateChat({ userId });
    }
    setOpenPanel('chat');
  };

  const showPublicChat = () => {
    setPendingPrivateChat(null);
    setSelectedChatId(publicChat?.chatId ?? null);
  };

  const activeChatId = selectedChat?.chatId ?? '';
  const activeChatIsPublic = pendingPrivateChat ? false : (selectedChat?.public ?? true);
  const activeChatTitle = pendingPrivateChat?.userName
    || selectedChat?.participant?.name
    || '';

  return (
    <>
      <ActionsComponent
        pluginApi={pluginApi}
        intl={intl}
        chatOpen={openPanel === 'chat'}
        activeChatId={activeChatId}
        onChatToggle={() => setOpenPanel((panel) => (panel === 'chat' ? null : 'chat'))}
        usersOpen={openPanel === 'users'}
        onUsersToggle={() => setOpenPanel((panel) => (panel === 'users' ? null : 'users'))}
      />
      <ChatPanel
        intl={intl}
        pluginApi={pluginApi}
        onClose={() => setOpenPanel(null)}
        actionsHeight={actions.height}
        streamMessages={streamMessages}
        isOpen={openPanel === 'chat'}
        chatId={activeChatId}
        chatTitle={activeChatTitle}
        isPublic={activeChatIsPublic}
        onShowPublicChat={showPublicChat}
      />
      {openPanel === 'users' && (
        <UsersPanel
          intl={intl}
          pluginApi={pluginApi}
          onClose={() => setOpenPanel(null)}
          actionsHeight={actions.height}
          onPrivateChat={openPrivateChat}
        />
      )}
    </>
  );
}

function PluginPip({ intl, pluginApi, pipWindow }: PluginPipProps): React.ReactNode {
  const { data: currentUser } = pluginApi.useCurrentUser();
  const { data: screenshare } = useScreenshare(pluginApi);
  const { latestStreamMessages, streamMessages } = useChatMessageStream(pluginApi);

  // Force strict booleans so layout can render even when hook payload is partial.
  const presenter = Boolean(currentUser?.presenter);
  const moderator = currentUser?.role === 'MODERATOR';
  // The participant grid is PiP's default view, even before anyone enables a camera.
  const hasWebcams = true;
  const hasScreenshare = Boolean(screenshare?.screenshare?.length);

  const containerClassName = ['container'];

  if (hasWebcams) containerClassName.push('has-webcams');
  if (hasScreenshare) containerClassName.push('has-screenshare');

  return (
    <PipWindowProvider pipWindow={pipWindow}>
      <LayoutProvider
        hasCameras={hasWebcams}
        hasScreenshare={hasScreenshare}
        presenter={presenter}
        moderator={moderator}
      >
        <ToastProvider intl={intl}>
          <div className={containerClassName.join(' ')}>
            <div className="video">
              <ScreenshareComponent pluginApi={pluginApi} />
              <CamerasComponent pluginApi={pluginApi} />
            </div>
            <PluginPipInner intl={intl} pluginApi={pluginApi} streamMessages={streamMessages} />
          </div>
          <ChatNotifier intl={intl} messages={latestStreamMessages} />
          {presenter && <RaisedHandNotifier intl={intl} pluginApi={pluginApi} />}
          <div id="modals-root" style={{ zIndex: 9999 }} />
        </ToastProvider>
      </LayoutProvider>
    </PipWindowProvider>
  );
}

export default PluginPip;
