import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import * as React from 'react';
import { useScreenshare } from './hooks';

interface Media {
  srcObject: MediaProvider;
}

const pollForScreenshareSrc = (
  container: Element = document.body,
): Promise<Media> => new Promise((resolve, reject) => {
  const TIMEOUT = 5000; // 5 seconds
  const start = performance.now();

  const poll = (timestamp: number) => {
    const element = container.querySelector('#screenshareContainer video');
    if (element && element instanceof HTMLVideoElement && element.srcObject) {
      return resolve({ srcObject: element.srcObject });
    }
    if (timestamp - start > TIMEOUT) {
      return reject();
    }
    return requestAnimationFrame(poll);
  };

  requestAnimationFrame(poll);
});

interface ScreenshareComponentProps {
  pluginApi: PluginApi;
  // pipWindow: Window;
}

function ScreenshareComponent(
  { pluginApi }: ScreenshareComponentProps,
): React.ReactNode {
  const {
    data: screenshareData,
  } = useScreenshare(pluginApi);
  const [screenshare, setScreenshare] = React.useState<Media | null>(null);

  React.useEffect(() => {
    async function update() {
      const isSharing = Boolean(screenshareData?.screenshare[0]?.stream);

      if (isSharing) {
        const src = await pollForScreenshareSrc();
        setScreenshare(src);
        return;
      }

      setScreenshare(null);
    }

    update();
  }, [screenshareData]);

  if (!screenshare) {
    return null;
  }

  return (
    <div className="screenshare">
      <video
        key={screenshareData?.screenshare[0]?.stream}
        autoPlay
        playsInline
        muted
        ref={(ref) => {
          if (ref && screenshare.srcObject) {
            // eslint-disable-next-line no-param-reassign
            ref.srcObject = screenshare.srcObject;
          }
        }}
      />
    </div>
  );
}

export default ScreenshareComponent;
