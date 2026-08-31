import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import * as React from 'react';
import { useScreenshare } from './hooks';
import Video from './video';
import { useLayoutContext } from '../contexts/layout';
import Skeleton from '../ui/skeleton';

interface Media {
  srcObject: MediaProvider;
}

const getScreenshareSrc = (): MediaProvider | null => document
  .querySelector<HTMLVideoElement>('#screenshareContainer video')?.srcObject ?? null;

interface ScreenshareComponentProps {
  pluginApi: PluginApi;
}

function ScreenshareComponent(
  { pluginApi }: ScreenshareComponentProps,
): React.ReactNode {
  const {
    data: screenshareData,
  } = useScreenshare(pluginApi);
  const [screenshare, setScreenshare] = React.useState<Media | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { screenshare: screenshareRect } = useLayoutContext();

  React.useEffect(() => {
    const streamId = screenshareData?.screenshare[0]?.stream;
    if (!streamId) {
      setScreenshare(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const syncScreenshare = () => {
      const srcObject = getScreenshareSrc();
      if (!srcObject) {
        setScreenshare(null);
        setLoading(true);
        return;
      }

      setScreenshare((current) => (
        current?.srcObject === srcObject ? current : { srcObject }
      ));
      setLoading(false);
    };

    syncScreenshare();
    // `srcObject` is a JS property: assigning it does not produce a DOM mutation.
    // Poll while sharing, and use an observer as a fast path when BBB remounts the
    // screenshare container during layout changes.
    const interval = window.setInterval(syncScreenshare, 500);
    const observer = new MutationObserver(syncScreenshare);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearInterval(interval);
      observer.disconnect();
    };
  }, [screenshareData?.screenshare[0]?.stream]);

  if (!screenshare && !loading) {
    return null;
  }

  const width = Math.min(screenshareRect.width, screenshareRect.height);

  return (
    <div
      className="screenshare"
      style={{
        position: 'absolute',
        left: screenshareRect.x,
        top: screenshareRect.y,
        width: screenshareRect.width,
        height: screenshareRect.height,
      }}
    >
      {loading ? <Skeleton aspectRatio="16 / 9" width={width} height="unset" /> : (
        <Video
          key={screenshareData?.screenshare[0]?.stream}
          srcObject={screenshare.srcObject}
        />
      )}
    </div>
  );
}

export default ScreenshareComponent;
