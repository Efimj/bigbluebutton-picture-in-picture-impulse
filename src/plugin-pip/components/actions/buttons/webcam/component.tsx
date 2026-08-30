import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape, defineMessages } from 'react-intl';
import { VIDEO_STREAMS_SUBSCRIPTION, type VideoStreamsSubscriptionResult } from '../../../cameras/queries';
import Tooltip from '../../../ui/tooltip';

export const intlMessages = defineMessages({
  webcamTooltipSharing: {
    id: 'plugin.webcam.tooltip.sharing',
    defaultMessage: 'Stop sharing webcams',
  },
  webcamTooltipNotSharing: {
    id: 'plugin.webcam.tooltip.notSharing',
    defaultMessage: 'Share webcam',
  },
});

interface WebcamButtonComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
}

function WebcamButtonComponent({ intl, pluginApi }: WebcamButtonComponentProps) {
  const currentUser = pluginApi.useCurrentUser();
  const {
    data: videoStreams,
  } = pluginApi.useCustomSubscription<VideoStreamsSubscriptionResult>(VIDEO_STREAMS_SUBSCRIPTION);

  const myStreams = videoStreams?.user_camera?.filter(
    (stream) => stream.user.userId === currentUser.data?.userId,
  );

  const amISharing = myStreams?.length > 0;
  const stopSharingLabel = intl.formatMessage(intlMessages.webcamTooltipSharing);
  const startSharingLabel = intl.formatMessage(intlMessages.webcamTooltipNotSharing);
  const actionLabel = amISharing ? stopSharingLabel : startSharingLabel;

  const handleToggleWebcam = () => {
    // Starting/stopping a camera involves BBB's WebRTC lifecycle in addition to
    // its GraphQL state. Reuse the main action-bar control so the preview modal,
    // media tracks and camera state are all handled by BBB itself.
    const selector = amISharing ? '[data-test="leaveVideo"]' : '[data-test="joinVideo"]';
    const mainWebcamButton = document.querySelector<HTMLButtonElement>(selector);

    if (!mainWebcamButton
      || mainWebcamButton.disabled
      || mainWebcamButton.getAttribute('aria-disabled') === 'true') return;

    mainWebcamButton.click();

    // BBB asks the user to select/confirm a device before starting the camera.
    // Bring that preview dialog into view after the PiP action was pressed.
    if (!amISharing) window.focus();
  };

  return (
    <Tooltip content={actionLabel}>
      {({ children, styles, ...props }) => (
        <button
          {...props}
          className="media-btn"
          type="button"
          style={styles}
          aria-pressed={amISharing}
          onClick={handleToggleWebcam}
        >
          <span className="sr-only">
            {actionLabel}
          </span>
          <i className={`icon-bbb-${amISharing ? 'video' : 'video_off'}`} />
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default WebcamButtonComponent;
