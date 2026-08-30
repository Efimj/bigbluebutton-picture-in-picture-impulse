import { useCallback } from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import {
  USER_SET_MUTED,
  type UserSetMutedMutationVariables,
} from './mutations';
import {
  CURRENT_USER_QUERY,
  type CurrentUserSubscriptionResult,
} from './queries';

export const useToggleVoice = (pluginApi: PluginApi) => {
  const [
    userSetMuted,
  ] = pluginApi.useCustomMutation!<UserSetMutedMutationVariables>(USER_SET_MUTED);

  const toggleVoice = async (userId: string, muted: boolean) => {
    try {
      if (userSetMuted) userSetMuted({ variables: { muted, userId } });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error on trying to toggle muted');
    }
  };

  return useCallback(toggleVoice, [userSetMuted]);
};

export const useCurrentUserVoice = (pluginApi: PluginApi) => {
  const {
    data: currentUserData,
  } = pluginApi.useCustomSubscription<CurrentUserSubscriptionResult>(CURRENT_USER_QUERY);

  return currentUserData?.user_current ? currentUserData.user_current[0].voice : undefined;
};

export default { useToggleVoice };
