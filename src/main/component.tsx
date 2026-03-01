import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ActionButtonDropdownOption, BbbPluginSdk, FloatingWindow } from 'bigbluebutton-html-plugin-sdk';
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
  const initialPipActive = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('pip-plugin-active') || 'false') === true;
    } catch {
      return false;
    }
  }, []);
  const pipActiveRef = React.useRef<boolean>(initialPipActive);
  const pipWindowRef = React.useRef<Window | null>(null);
  const startPipWindowRef = React.useRef<() => Promise<boolean>>(async () => false);
  const hasMediaRef = React.useRef(false);
  const [pipActive, setPipActive] = React.useState<boolean>(initialPipActive);
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

  const handleTogglePip = React.useCallback(() => {
    const nextPipActive = !pipActiveRef.current;
    // eslint-disable-next-line no-console
    console.log(`${LOG_PREFIX} Toggle clicked`, {
      current: pipActiveRef.current,
      next: nextPipActive,
      isPipSupported,
      hasMedia: hasMediaRef.current,
    });
    pipActiveRef.current = nextPipActive;
    localStorage.setItem('pip-plugin-active', JSON.stringify(nextPipActive));
    setPipActive(nextPipActive);

    if (nextPipActive) {
      // Try to open PiP from a direct user gesture (more reliable in some browsers).
      // eslint-disable-next-line no-console
      startPipWindowRef.current()
        .then((started) => {
          // eslint-disable-next-line no-console
          console.log(`${LOG_PREFIX} Toggle start result`, { started });
          if (started) console.info('PiP window started by action button');
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(`${LOG_PREFIX} Toggle start failed`, error);
        });
    } else {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Toggle deactivated: closing PiP`);
      releaseKeepAlive();
      pipWindowRef.current?.close();
      resumeMainTabVideos();
    }
  }, []);

  React.useEffect(() => {
    if (!isPipSupported) return;

    const activateLabel = safeIntl.formatMessage(intlMessages.activate) || 'Activate PiP Window';
    const deactivateLabel = safeIntl.formatMessage(intlMessages.deactivate) || 'Deactivate PiP Window';

    pluginApi.setActionButtonDropdownItems([
      new ActionButtonDropdownOption({
        id: 'plugin-pip-toggle',
        dataTest: 'plugin-pip-toggle',
        allowed: true,
        icon: pipActive ? 'desktop_off' : 'desktop',
        label: pipActive ? deactivateLabel : activateLabel,
        onClick: handleTogglePip,
        tooltip: pipActive ? deactivateLabel : activateLabel,
      }),
    ]);
  }, [safeIntl, pipActive, pluginApi, handleTogglePip]);

  React.useEffect(() => {
    const startPipWindow = async () => {
      if (isPipSupported && pipActiveRef.current) {
        // eslint-disable-next-line no-console
        console.log(`${LOG_PREFIX} Start requested`, {
          source: 'startPipWindow',
          active: pipActiveRef.current,
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

        // Some Chromium-based browsers (e.g. Yandex Browser) may not support
        // the preferInitialWindowPlacement option — retry without it as a fallback.
        let pipWindow: Window;
        try {
          // @ts-expect-error This web API may not be supported by all major browsers.
          pipWindow = await documentPictureInPicture.requestWindow({
            height: 270,
            width: 480,
            preferInitialWindowPlacement: true,
          });
          // eslint-disable-next-line no-console
          console.log(`${LOG_PREFIX} requestWindow success with preferInitialWindowPlacement`);
        } catch {
          // eslint-disable-next-line no-console
          console.log(`${LOG_PREFIX} requestWindow retry without preferInitialWindowPlacement`);
          // @ts-expect-error This web API may not be supported by all major browsers.
          pipWindow = await documentPictureInPicture.requestWindow({
            height: 270,
            width: 480,
          });
        }

        pipWindowRef.current = pipWindow;
        // eslint-disable-next-line no-console
        console.log(`${LOG_PREFIX} PiP window created`);

        const pipDiv = pipWindow.document.createElement('div');
        pipDiv.setAttribute('id', 'pip-root');
        pipWindow.document.body.append(pipDiv);
        const pipRoot = ReactDOM.createRoot(pipWindow.document.getElementById('pip-root'));

        const handlePageHide = () => {
          pipWindowRef.current = null;
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
      }

      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Start skipped`, {
        isPipSupported,
        active: pipActiveRef.current,
        hasMedia: hasMediaRef.current,
      });
      return false;
    };

    startPipWindowRef.current = startPipWindow;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        acquireKeepAlive();
        // eslint-disable-next-line no-console
        startPipWindow().then((started) => { if (started) console.info('PiP window started by visibility change'); }).catch(console.warn);
      } else {
        releaseKeepAlive();
        pipWindowRef.current?.close();
        // Force-resume videos in the main tab that may have been paused
        // by the browser while the tab was in the background.
        resumeMainTabVideos();
      }
    };

    const handleEnterPip = () => {
      // eslint-disable-next-line no-console
      startPipWindow().then((started) => { if (started) console.info('PiP window started by PiP action'); }).catch(console.warn);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // @ts-expect-error This media action may not be supported by all major browsers.
    navigator.mediaSession.setActionHandler('enterpictureinpicture', handleEnterPip);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseKeepAlive();

      // @ts-expect-error This media action may not be supported by all major browsers.
      navigator.mediaSession.setActionHandler('enterpictureinpicture', null);
    };
  }, [safeIntl, pluginApi]);

  React.useEffect(() => {
    if (!isPipSupported || !pipActive) return undefined;

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
  }, [pipActive, amISharingWebcam, joinedVoice]);

  React.useEffect(() => {
    if (!isPipSupported || !pipActive) return undefined;

    if (showFocusWarning) {
      const actionsButton = document.querySelector('[data-test="actionsButton"]');
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
  }, [showFocusWarning, pluginApi, pipActive, safeIntl]);

  return null;
}

export default MainComponent;
