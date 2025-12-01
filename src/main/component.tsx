import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ActionButtonDropdownOption, BbbPluginSdk } from 'bigbluebutton-html-plugin-sdk';
import { css } from 'styled-components';
import Pip from '../plugin-pip/component';

const isPipSupported = 'documentPictureInPicture' in window;

const cssRules = css`
  * {
    box-sizing: border-box;
    min-width: 0;
  }

  *::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  *::-webkit-scrollbar-button {
    width: 0;
    height: 0;
  }
  *::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,.25);
    border: none;
    border-radius: 50px;
  }
  *::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.5); }
  *::-webkit-scrollbar-thumb:active { background: rgba(0,0,0,.25); }
  *::-webkit-scrollbar-track {
    background: rgba(0,0,0,.25);
    border: none;
    border-radius: 50px;
  }
  *::-webkit-scrollbar-track:hover { background: rgba(0,0,0,.25); }
  *::-webkit-scrollbar-track:active { background: rgba(0,0,0,.25); }
  *::-webkit-scrollbar-corner { background: 0 0; }
  
  #videoWrapper {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
  }

  video {
    width: 100%;
    border-radius: 8px;
  }

  html {
    height: 100%;
  }

  body {
    font-family: 'Source Sans Pro', Arial, sans-serif;
    font-size: 1rem;
    background-color: #202020;
    height: 100%;
  }

  #pip-root {
    height: 100%;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .actions {
    padding: 0.5rem;
    width: 100%;
    display: flex;
    align-items: flex-end;

    .controls {
      background-color: #303030;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      border-radius: 0.75rem;
      flex-grow: 1;
      padding: 0.25rem;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    border: 0;
  }

  @font-face {
    font-family: 'bbb-icons';
    src: url('fonts/BbbIcons/bbb-icons.woff2?v=VERSION') format('woff2'),
    url('fonts/BbbIcons/bbb-icons.woff?v=VERSION') format('woff');
    font-weight: normal;
    font-style: normal;
  }

  *:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .media-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    line-height: normal;
    position: relative;
  }

  .media-btn:disabled {
    cursor: not-allowed;
  }

  .media-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .media-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px #ffffff;
  }

  .badge {
    position: absolute;
    right: -10%;
    top: -10%;
    border-radius: 50%;
    line-height: 1;
    padding: 2px;
    height: 1rem;
    width: 1rem;
    font-size: 0.65rem;
    display: grid;
    place-items: center;
    background-color: #DF2721;
  }

  .video {
    flex-grow: 1;
    flex-shrink: 1;
    position: relative;
    padding: 0.75rem;
    display: flex;
    gap: 2rem;
  }

  .presenter-view .video {
    flex-direction: row-reverse;
  }

  .webcams {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 100%;
    overflow: auto;
    flex-basis: 25%;
  }

  .presenter-view .webcams {
    flex-basis: 75%;
    flex-direction: row;
    align-items: center;
  }

  .pip-video-container {
    position: relative;
    max-width: 240px;
  }

  .presenter-view .pip-video-container {
    min-width: 120px;
  }

  .screenshare {
    flex-basis: 75%;
    display: flex;
    align-items: flex-start;

    .screenshare-placeholder {
      display: grid;
      place-items: center;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 0.5rem;
      color: #eee;
      background-color: #292929;
    }
  }

  .presenter-view .screenshare {
    flex-basis: 25%;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 white;
    }
    70% {
      box-shadow: 0 0 0 0.5625rem transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    } 
  }

  .pulse {
    animation: pulse 1s ease-in infinite;
  }

  .pip-video-container .username {
    position: absolute;
    color: white;
    left: 0.25rem;
    bottom: 0.25rem;
    font-size: 75%;
    background-color: #111111CC;
    padding: 0.2rem;
    border-radius: 0.75rem;
  }
`;

interface MainComponentProps {
  pluginUuid: string;
}

function MainComponent({ pluginUuid }: MainComponentProps): React.ReactNode {
  BbbPluginSdk.initialize(pluginUuid);
  const pluginApi = BbbPluginSdk.getPluginApi(pluginUuid);
  const pipActiveRef = React.useRef(false);
  const [pipActive, setPipActive] = React.useState(false);

  pluginApi.setActionButtonDropdownItems([
    new ActionButtonDropdownOption({
      allowed: true,
      icon: pipActive ? 'desktop_off' : 'desktop',
      label: pipActive ? 'Deactivate PiP Window' : 'Activate PiP Window',
      onClick: () => {
        pipActiveRef.current = !pipActiveRef.current;
        setPipActive((p) => !p);
      },
      tooltip: pipActive ? 'Deactivate PiP Window' : 'Activate PiP Window',
    }),
  ]);

  // @ts-expect-error untyped
  navigator.mediaSession.setActionHandler('enterpictureinpicture', async () => {
    if (isPipSupported && pipActiveRef.current) {
      try {
        // @ts-expect-error untyped
        const pipWindow = await documentPictureInPicture.requestWindow({
          height: 400,
          width: 800,
        });

        const pipDiv = pipWindow.document.createElement('div');
        pipDiv.setAttribute('id', 'pip-root');
        pipWindow.document.body.append(pipDiv);
        const PIP_ROOT = ReactDOM.createRoot(pipWindow.document.getElementById('pip-root'));

        const handlePageHide = () => {
          PIP_ROOT.unmount();
          window.focus();
        };

        pipWindow.addEventListener('pagehide', handlePageHide);

        const style = document.createElement('style');
        style.textContent = cssRules.toString();
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

        PIP_ROOT.render(<Pip pluginUuid={pluginUuid} pipWindow={pipWindow} />);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  });

  return null;
}

export default MainComponent;
