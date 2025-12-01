import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import AudioButtonComponent from './buttons/audio/component';
import WebcamButtonComponent from './buttons/webcam/component';
import UnreadChatButtonComponent from './buttons/unread-chat/component';
import RaisedHandsButtonComponent from './buttons/raised-hands/component';

interface ActionsComponentProps {
  pluginApi: PluginApi;
  pipWindow: Window;
}

function ActionsComponent({ pluginApi, pipWindow }: ActionsComponentProps): React.ReactNode {
  return (
    <div className="actions">
      <div className="controls">
        <AudioButtonComponent pluginApi={pluginApi} />
        <WebcamButtonComponent pluginApi={pluginApi} />
        <UnreadChatButtonComponent pluginApi={pluginApi} pipWindow={pipWindow} />
        <RaisedHandsButtonComponent pluginApi={pluginApi} pipWindow={pipWindow} />
      </div>
    </div>
  );
}

export default ActionsComponent;
