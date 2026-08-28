import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import {
  ActionsBarButton,
  ActionsBarPosition,
  BbbPluginSdk,
  FloatingWindow,
} from 'bigbluebutton-html-plugin-sdk';
import { defineMessages, IntlShape } from 'react-intl';
import { useI18n } from '../common/hooks';
import { acquireKeepAlive, releaseKeepAlive, resumeMainTabVideos } from '../common/keep-alive';
import Pip from '../plugin-pip/component';
import { useVideoStreams } from '../plugin-pip/components/cameras/hooks';
import { useScreenshare } from '../plugin-pip/components/screenshare/hooks';
import FocusWarning from '../plugin-pip/components/warning/component';
import { useCurrentUserVoice } from '../plugin-pip/components/actions/hooks';
import styles from './stylesheet';

const isPipSupported = 'documentPictureInPicture' in window;
const LOG_PREFIX = '[PiP Plugin]';
const PIP_WINDOW_WIDTH = 350;
const PIP_WINDOW_HEIGHT = 480;

function isMobileOrTabletDevice() {
  const userAgent = navigator.userAgent || '';
  const mobileOrTabletPattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;
  const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return mobileOrTabletPattern.test(userAgent) || isTouchMac;
}

const intlMessages = defineMessages({
  activate: {
    id: 'plugin.pip.activate',
    defaultMessage: 'Activate PiP Window',
  },
  deactivate: {
    id: 'plugin.pip.deactivate',
    defaultMessage: 'Deactivate PiP Window',
  },
});

interface MainComponentProps {
  pluginUuid: string;
}

function MainComponent({ pluginUuid }: MainComponentProps): React.ReactNode {
  BbbPluginSdk.initialize(pluginUuid);
  const pluginApi = BbbPluginSdk.getPluginApi(pluginUuid);
  const { intl } = useI18n(pluginApi);
  const isMobileOrTablet = React.useMemo(() => isMobileOrTabletDevice(), []);
  const fallbackIntl = React.useMemo(() => ({
    formatMessage: (
      descriptor: { defaultMessage?: string; id?: string } | null | undefined,
      values?: Record<string, unknown>,
    ) => {
      const template = descriptor?.defaultMessage || descriptor?.id || '';
      if (!values) return template;

      return Object.entries(values).reduce((text, [key, value]) => (
        text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
      ), template);
    },
    formatTime: (value: string | number | Date) => {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    },
  }) as unknown as IntlShape, []);
  const safeIntl = intl || fallbackIntl;
  const initialAutoPipEnabled = React.useMemo(() => {
    try {
      const storedValue = localStorage.getItem('pip-plugin-active');

      // Auto-PiP is enabled by default. The toolbar button lets the user opt out
      // and keeps that preference for future meetings.
      return storedValue === null || JSON.parse(storedValue) === true;
    } catch {
      return true;
    }
  }, []);
  const autoPipEnabledRef = React.useRef<boolean>(initialAutoPipEnabled);
  const pipWindowRef = React.useRef<Window | null>(null);
  const pipRequestRef = React.useRef<Promise<boolean> | null>(null);
  const startPipWindowRef = React.useRef<() => Promise<boolean>>(async () => false);
  const hasMediaRef = React.useRef(false);
  const [autoPipEnabled, setAutoPipEnabled] = React.useState<boolean>(initialAutoPipEnabled);
  const [pipWindowOpen, setPipWindowOpen] = React.useState(false);
  const [showFocusWarning, setShowFocusWarning] = React.useState(false);
  const { data: webcams } = useVideoStreams(pluginApi);
  const { data: screenshare } = useScreenshare(pluginApi);
  const hasWebcams = Boolean(webcams?.user_camera?.length);
  const hasScreenshare = Boolean(screenshare?.screenshare?.length);
  const hasMedia = hasScreenshare || hasWebcams;
  hasMediaRef.current = hasMedia;
  const { data: currentUser } = pluginApi.useCurrentUser();
  const { joined: joinedVoice } = useCurrentUserVoice(pluginApi) || {};
  const amISharingWebcam = Boolean(currentUser?.cameras?.length);

  React.useEffect(() => {
    if (!isMobileOrTablet) return;

    autoPipEnabledRef.current = false;
    localStorage.setItem('pip-plugin-active', 'false');
    setAutoPipEnabled(false);
    setPipWindowOpen(false);
    releaseKeepAlive();
    pipWindowRef.current?.close();
    pluginApi.setActionsBarItems([]);
  }, [isMobileOrTablet, pluginApi]);

  const handleTogglePip = React.useCallback(() => {
    if (isMobileOrTablet) return;

    // The persisted auto-PiP preference and the actual window state are separate.
    // When no window exists, a toolbar click must always open one from this user gesture.
    // When a window exists, the same click closes it and opts out of automatic reopening.
    const currentPipWindow = pipWindowRef.current
      // @ts-expect-error This web API may not be supported by all major browsers.
      || (isPipSupported ? documentPictureInPicture.window : null);
    const shouldOpen = !currentPipWindow;
    // eslint-disable-next-line no-console
    console.log(`${LOG_PREFIX} Toggle clicked`, {
      autoPipEnabled: autoPipEnabledRef.current,
      pipWindowOpen: Boolean(currentPipWindow),
      action: shouldOpen ? 'open' : 'close',
      isPipSupported,
      hasMedia: hasMediaRef.current,
    });

    if (shouldOpen) {
      autoPipEnabledRef.current = true;
      localStorage.setItem('pip-plugin-active', 'true');
      setAutoPipEnabled(true);
      // Try to open PiP from a direct user gesture (more reliable in some browsers).
      // eslint-disable-next-line no-console
      startPipWindowRef.current()
        .then((started) => {
          // eslint-disable-next-line no-console
          console.log(`${LOG_PREFIX} Toggle start result`, { started });
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(`${LOG_PREFIX} Toggle start failed`, error);
        });
    } else {
      autoPipEnabledRef.current = false;
      localStorage.setItem('pip-plugin-active', 'false');
      setAutoPipEnabled(false);
      setPipWindowOpen(false);
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Toggle deactivated: closing PiP`);
      releaseKeepAlive();
      currentPipWindow.close();
      pipWindowRef.current = null;
      resumeMainTabVideos();
    }
  }, [isMobileOrTablet]);

  React.useEffect(() => {
    if (isMobileOrTablet) {
      pluginApi.setActionsBarItems([]);
      return undefined;
    }

    const activateLabel = safeIntl.formatMessage(intlMessages.activate) || 'Activate PiP Window';
    const deactivateLabel = safeIntl.formatMessage(intlMessages.deactivate) || 'Deactivate PiP Window';

    pluginApi.setActionsBarItems([
      new ActionsBarButton({
        id: 'plugin-pip-toggle',
        dataTest: 'plugin-pip-toggle',
        position: ActionsBarPosition.RIGHT,
        icon: { iconName: pipWindowOpen ? 'desktop_off' : 'desktop' },
        label: pipWindowOpen ? deactivateLabel : activateLabel,
        onClick: handleTogglePip,
        tooltip: pipWindowOpen ? deactivateLabel : activateLabel,
        circle: true,
        hideLabel: true,
        size: 'lg',
      }),
    ]);

    return undefined;
  }, [safeIntl, pipWindowOpen, pluginApi, handleTogglePip, isMobileOrTablet]);

  React.useEffect(() => {
    const startPipWindow = async (): Promise<boolean> => {
      if (pipRequestRef.current) return pipRequestRef.current;

      if (isPipSupported && !isMobileOrTablet && autoPipEnabledRef.current) {
        // eslint-disable-next-line no-console
        console.log(`${LOG_PREFIX} Start requested`, {
          source: 'startPipWindow',
          autoPipEnabled: autoPipEnabledRef.current,
          hasMedia: hasMediaRef.current,
        });
        if (!hasMediaRef.current) {
          // eslint-disable-next-line no-console
          console.log(`${LOG_PREFIX} No media detected by hooks, opening PiP anyway`);
        }
        // @ts-expect-error This web API may not be supported by all major browsers.
        if (documentPictureInPicture.window) {
          // eslint-disable-next-line no-console
          console.log(`${LOG_PREFIX} Start skipped: PiP window already open`);
          return false;
        }

        const pipRequest = (async () => {
          // Some Chromium-based browsers (e.g. Yandex Browser) may not support
          // the preferInitialWindowPlacement option — retry without it as a fallback.
          let pipWindow: Window;
          try {
            // @ts-expect-error This web API may not be supported by all major browsers.
            pipWindow = await documentPictureInPicture.requestWindow({
              height: PIP_WINDOW_HEIGHT,
              width: PIP_WINDOW_WIDTH,
              // Ask Chrome to use its default PiP placement (normally bottom-right)
              // instead of restoring a position previously chosen by the user.
              preferInitialWindowPlacement: true,
            });
            // eslint-disable-next-line no-console
            console.log(`${LOG_PREFIX} requestWindow success with preferInitialWindowPlacement`);
          } catch (error) {
            // A missing user activation or disabled API cannot be fixed by retrying
            // with a different options object.
            if (error instanceof DOMException
              && (error.name === 'NotAllowedError' || error.name === 'NotSupportedError')) {
              throw error;
            }
            // eslint-disable-next-line no-console
            console.log(`${LOG_PREFIX} requestWindow retry without preferInitialWindowPlacement`);
            // @ts-expect-error This web API may not be supported by all major browsers.
            pipWindow = await documentPictureInPicture.requestWindow({
              height: PIP_WINDOW_HEIGHT,
              width: PIP_WINDOW_WIDTH,
            });
          }

          pipWindowRef.current = pipWindow;
          setPipWindowOpen(true);
          // eslint-disable-next-line no-console
          console.log(`${LOG_PREFIX} PiP window created`);

          const pipDiv = pipWindow.document.createElement('div');
          pipDiv.setAttribute('id', 'pip-root');
          pipWindow.document.body.append(pipDiv);
          const pipRoot = ReactDOM.createRoot(pipWindow.document.getElementById('pip-root'));

          const handlePageHide = () => {
            pipWindowRef.current = null;
            setPipWindowOpen(false);
            releaseKeepAlive();
            pipRoot.unmount();
          };

          pipWindow.addEventListener('pagehide', handlePageHide);

          const style = document.createElement('style');
          style.textContent = styles.toString();
          pipWindow.document.head.appendChild(style);

          const normalize = document.createElement('link');
          normalize.rel = 'stylesheet';
          normalize.type = 'text/css';
          normalize.href = 'stylesheets/normalize.css';
          pipWindow.document.head.appendChild(normalize);

          const icons = document.createElement('link');
          icons.rel = 'stylesheet';
          icons.type = 'text/css';
          icons.href = 'stylesheets/bbb-icons.css';
          pipWindow.document.head.appendChild(icons);

          const fonts = document.createElement('link');
          fonts.rel = 'stylesheet';
          fonts.type = 'text/css';
          fonts.href = 'stylesheets/bbb-icons.css';
          pipWindow.document.head.appendChild(fonts);

          pipRoot.render(
            <Pip
              pluginApi={pluginApi}
              pipWindow={pipWindow}
              intl={safeIntl}
            />,
          );
          // eslint-disable-next-line no-console
          console.log(`${LOG_PREFIX} PiP render mounted`);

          return true;
        })();

        pipRequestRef.current = pipRequest;
        try {
          return await pipRequest;
        } finally {
          if (pipRequestRef.current === pipRequest) pipRequestRef.current = null;
        }
      }

      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Start skipped`, {
        isPipSupported,
        isMobileOrTablet,
        autoPipEnabled: autoPipEnabledRef.current,
        hasMedia: hasMediaRef.current,
      });
      return false;
    };

    startPipWindowRef.current = startPipWindow;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        acquireKeepAlive();
      } else {
        releaseKeepAlive();
        pipWindowRef.current?.close();
        pipWindowRef.current = null;
        setPipWindowOpen(false);
        // Force-resume videos in the main tab that may have been paused
        // by the browser while the tab was in the background.
        resumeMainTabVideos();
      }
    };

    const handleEnterPip = () => {
      startPipWindow().catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(`${LOG_PREFIX} Automatic PiP start failed`, error);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    try {
      // @ts-expect-error This media action may not be supported by all major browsers.
      navigator.mediaSession?.setActionHandler('enterpictureinpicture', handleEnterPip);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`${LOG_PREFIX} Automatic PiP is not supported by this browser`, error);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseKeepAlive();

      try {
        // @ts-expect-error This media action may not be supported by all major browsers.
        navigator.mediaSession?.setActionHandler('enterpictureinpicture', null);
      } catch {
        // The browser did not accept this Media Session action during setup either.
      }
    };
  }, [safeIntl, pluginApi, isMobileOrTablet]);

  React.useEffect(() => {
    if (!isPipSupported || isMobileOrTablet || !autoPipEnabled) return undefined;

    function handleVisibilityChange() {
      setShowFocusWarning(!document.hidden && !amISharingWebcam && !joinedVoice);
    }

    function handleFocus() {
      setShowFocusWarning(false);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleFocus, { capture: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleFocus, { capture: true });
    };
  }, [autoPipEnabled, amISharingWebcam, joinedVoice, isMobileOrTablet]);

  React.useEffect(() => {
    if (!isPipSupported || isMobileOrTablet || !autoPipEnabled) return undefined;

    if (showFocusWarning) {
      const actionsButton = document.querySelector('[data-test="actionsButton"]');
      if (!actionsButton) return undefined;
      const rect = actionsButton.getBoundingClientRect();
      pluginApi.setFloatingWindows([
        new FloatingWindow({
          id: 'plugin-pip-focus-warning',
          top: rect.top - 90,
          left: rect.left + (rect.width / 2) - 181,
          movable: true,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          contentFunction: (element: HTMLElement) => {
            const root = ReactDOM.createRoot(element);
            root.render(<FocusWarning intl={safeIntl} />);
            return root;
          },
        }),
      ]);
    }

    return () => {
      pluginApi.setFloatingWindows([]);
    };
  }, [showFocusWarning, pluginApi, autoPipEnabled, safeIntl, isMobileOrTablet]);

  return null;
}

export default MainComponent;
