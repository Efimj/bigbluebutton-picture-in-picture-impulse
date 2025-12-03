import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { type VideoStreamsSubscriptionResult, VIDEO_STREAMS_SUBSCRIPTION } from './queries';

export const useVideoStreams = (pluginApi: PluginApi) => {
  const response = pluginApi.useCustomSubscription!<VideoStreamsSubscriptionResult>(
    VIDEO_STREAMS_SUBSCRIPTION,
  );
  return response;
};
