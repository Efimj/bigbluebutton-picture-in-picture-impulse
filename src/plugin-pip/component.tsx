import * as React from 'react';
import { BbbPluginSdk } from 'bigbluebutton-html-plugin-sdk';
import CamerasComponent from './components/cameras/component';
import ActionsComponent from './components/actions/component';
import ScreenshareComponent from './components/screenshare/component';
import ChatNotifier from './components/chat/notifier';
import { ToastProvider } from './components/ui/toast';
import { useVideoStreams } from './components/cameras/hooks';
import { useScreenshare } from './components/screenshare/hooks';

interface PluginPipProps {
  pluginUuid: string;
  pipWindow: Window;
}

function PluginPip({ pluginUuid, pipWindow }: PluginPipProps): React.ReactNode {
  const pluginApi = BbbPluginSdk.getPluginApi(pluginUuid);
  const { data: currentUser } = pluginApi.useCurrentUser();
  const { data: webcams } = useVideoStreams(pluginApi);
  const { data: screenshare } = useScreenshare(pluginApi);
  const presenter = currentUser?.presenter;
  const hasWebcams = Boolean(webcams?.user_camera?.length);
  const hasScreenshare = Boolean(screenshare?.screenshare?.length);

  const containerClassName = ['container'];

  containerClassName.push(presenter ? 'presenter-view' : 'viewer-view');
  if (hasWebcams) containerClassName.push('has-webcams');
  if (hasScreenshare) containerClassName.push('has-screenshare');

  return (
    <ToastProvider>
      <div className={containerClassName.join(' ')}>
        <div className="video">
          <ScreenshareComponent pluginApi={pluginApi} />
          <CamerasComponent pluginApi={pluginApi} />
        </div>
        <ActionsComponent pluginApi={pluginApi} pipWindow={pipWindow} />
      </div>
      <ChatNotifier pluginApi={pluginApi} />
    </ToastProvider>
  );
}

export default PluginPip;
