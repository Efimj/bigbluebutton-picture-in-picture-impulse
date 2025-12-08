import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { type ScreenshareSubscriptionResult, SCREENSHARE } from './queries';

export const useScreenshare = (pluginApi: PluginApi) => {
  const response = pluginApi.useCustomSubscription!<ScreenshareSubscriptionResult>(
    SCREENSHARE,
  );
  return response;
};
