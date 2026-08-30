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
import { ChatMessage } from './components/chat/queries';
import { useVideoStreams } from './components/cameras/hooks';
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
  const { actions } = useLayoutContext();

  return (
    <>
      <ActionsComponent
        pluginApi={pluginApi}
        intl={intl}
        chatOpen={openPanel === 'chat'}
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
      />
      {openPanel === 'users' && (
        <UsersPanel
          intl={intl}
          pluginApi={pluginApi}
          onClose={() => setOpenPanel(null)}
          actionsHeight={actions.height}
        />
      )}
    </>
  );
}

function PluginPip({ intl, pluginApi, pipWindow }: PluginPipProps): React.ReactNode {
  const { data: currentUser } = pluginApi.useCurrentUser();
  const { data: webcams } = useVideoStreams(pluginApi);
  const { data: screenshare } = useScreenshare(pluginApi);
  const { latestStreamMessages, streamMessages } = useChatMessageStream(pluginApi);

  // Force strict booleans so layout can render even when hook payload is partial.
  const presenter = Boolean(currentUser?.presenter);
  const moderator = currentUser?.role === 'MODERATOR';
  const hasWebcams = Boolean(webcams?.user_camera?.length);
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
