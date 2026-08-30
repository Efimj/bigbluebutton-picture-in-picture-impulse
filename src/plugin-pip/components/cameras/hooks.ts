import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { type VideoStreamsSubscriptionResult, VIDEO_STREAMS_SUBSCRIPTION } from './queries';
import {
  PARTICIPANTS_SUBSCRIPTION,
  ParticipantsSubscriptionResponse,
} from '../actions/buttons/users/queries';

export const useVideoStreams = (pluginApi: PluginApi) => {
  const response = pluginApi.useCustomSubscription!<VideoStreamsSubscriptionResult>(
    VIDEO_STREAMS_SUBSCRIPTION,
  );
  return response;
};

export const useParticipants = (pluginApi: PluginApi) => pluginApi
  .useCustomSubscription!<ParticipantsSubscriptionResponse>(PARTICIPANTS_SUBSCRIPTION);
