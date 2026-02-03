import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape, defineMessages } from 'react-intl';
import Tooltip from '../../../ui/tooltip';
import { useCurrentUserVoice, useToggleVoice } from '../../hooks';

export const intlMessages = defineMessages({
  audioTooltipNoAudio: {
    id: 'plugin.audio.tooltip.noAudio',
    defaultMessage: 'No audio',
  },
  audioTooltipUnmute: {
    id: 'plugin.audio.tooltip.unmute',
    defaultMessage: 'Unmute',
  },
  audioTooltipMute: {
    id: 'plugin.audio.tooltip.mute',
    defaultMessage: 'Mute',
  },
  audioSrOnlyUnmute: {
    id: 'plugin.audio.srOnly.unmute',
    defaultMessage: 'Unmute Me',
  },
  audioSrOnlyMute: {
    id: 'plugin.audio.srOnly.mute',
    defaultMessage: 'Mute Me',
  },
});

interface AudioButtonComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
}

function AudioButtonComponent({ intl, pluginApi }: AudioButtonComponentProps) {
  const currentUser = pluginApi.useCurrentUser!();
  const currentUserVoice = useCurrentUserVoice(pluginApi);

  const toggleVoice = useToggleVoice(pluginApi);
  const noAudio = !currentUserVoice
    || currentUserVoice.listenOnly
    || currentUserVoice.listenOnlyInputDevice;

  const className = ['media-btn'];

  if (currentUserVoice?.talking) {
    className.push('pulse');
  }

  let title;

  if (noAudio) {
    title = intl.formatMessage(intlMessages.audioTooltipNoAudio);
  } else if (currentUserVoice?.muted) {
    title = intl.formatMessage(intlMessages.audioTooltipUnmute);
  } else {
    title = intl.formatMessage(intlMessages.audioTooltipMute);
  }

  return (
    <Tooltip content={title}>
      {({ children, styles, ...props }) => (
        <button
          {...props}
          className={className.join(' ')}
          type="button"
          style={styles}
          disabled={noAudio}
          onClick={() => {
            if (currentUser && currentUser.data && !noAudio) {
              toggleVoice(currentUser.data.userId, !currentUserVoice.muted);
            }
          }}
        >
          <span className="sr-only">
            {currentUserVoice?.muted
              ? intl.formatMessage(intlMessages.audioSrOnlyUnmute)
              : intl.formatMessage(intlMessages.audioSrOnlyMute)}
          </span>
          {noAudio ? (
            <i className="icon-bbb-no_audio" />
          ) : (
            <i className={`icon-bbb-${currentUserVoice?.muted ? 'mute' : 'unmute'}`} />
          )}
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default AudioButtonComponent;
