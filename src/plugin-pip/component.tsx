import * as React from 'react';
import { BbbPluginSdk } from 'bigbluebutton-html-plugin-sdk';
import CamerasComponent from './components/cameras/component';
import ActionsComponent from './components/actions/component';
import ScreenshareComponent from './components/screenshare/component';
import ChatNotifier from './components/chat/notifier';
import { ToastProvider } from './components/ui/toast';

interface PluginPipProps {
  pluginUuid: string;
  pipWindow: Window;
}

function PluginPip({ pluginUuid, pipWindow }: PluginPipProps): React.ReactNode {
  const pluginApi = BbbPluginSdk.getPluginApi(pluginUuid);
  const { data: currentUser } = pluginApi.useCurrentUser();
  const presenter = currentUser?.presenter;

  return (
    <ToastProvider>
      <div className={`container ${presenter ? 'presenter-view' : 'viewer-view'}`}>
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
