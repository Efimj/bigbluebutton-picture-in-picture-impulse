import * as React from 'react';
import { useEffect } from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { useVideoStreams } from './hooks';
import Video from './video';
import { useScreenshare } from '../screenshare/hooks';
import Loader from '../ui/loader';

const createVideoSelector = (streamId: string) => `.video-provider_list .videoContainer[data-stream="${streamId}"] video`;

const pollForVideoSrc = (
  streamId: string,
  container: Element = document.body,
): Promise<MediaStream | null> => new Promise((resolve) => {
  const TIMEOUT = 5000; // 5 seconds
  const start = performance.now();
  const selector = createVideoSelector(streamId);

  const poll = (timestamp: number) => {
    const element = container.querySelector(selector);
    if (element && element instanceof HTMLVideoElement && element.srcObject) {
      return resolve(element.srcObject as MediaStream);
    }
    if (timestamp - start > TIMEOUT) {
      return resolve(null);
    }
    return requestAnimationFrame(poll);
  };

  requestAnimationFrame(poll);
});

const VIDEO_LIST_CLASSNAME = 'video-provider_list';

interface Media {
  srcObject: MediaStream;
  streamId: string;
  userName: string;
  userId: string;
  userTalking: boolean;
}

interface CamerasComponentProps {
  pluginApi: PluginApi;
}

function CamerasComponent({ pluginApi }: CamerasComponentProps): React.ReactNode {
  const [videos, setVideos] = React.useState<Media[]>([]);
  const [loading, setLoading] = React.useState(true);

  const {
    data: videoStreamsData,
  } = useVideoStreams(pluginApi);
  const { data: currentUser } = pluginApi.useCurrentUser();
  const {
    data: screenshareData,
  } = useScreenshare(pluginApi);
  const isSharingScreen = Boolean(screenshareData?.screenshare[0]?.stream);

  useEffect(() => {
    async function update() {
      const videoList = document.getElementsByClassName(VIDEO_LIST_CLASSNAME)[0];
      const streams = videoStreamsData?.user_camera || [];

      const videoSrc = streams.map(
        async (stream) => {
          const srcObject = await pollForVideoSrc(stream.streamId, videoList);

          return {
            streamId: stream?.streamId,
            userName: stream?.user?.name,
            userId: stream?.user?.userId,
            userTalking: stream?.voice?.talking,
            srcObject,
          };
        },
      );

      const videoResolved = await Promise.all(videoSrc);

      setVideos(videoResolved.filter((v) => v.srcObject));
    }

    setLoading(true);
    update().finally(() => {
      setLoading(false);
    });
  }, [videoStreamsData]);

  if (loading && !videos.length) {
    return (
      <div className="webcams" style={{ justifyContent: 'center' }}>
        <Loader />
      </div>
    );
  }

  if (!videos.length) {
    return null;
  }

  const style: React.CSSProperties = currentUser?.presenter || !isSharingScreen ? {
    gridTemplateColumns: `repeat(${videos.length}, minmax(min-content, max-content))`,
  } : {
    gridTemplateRows: `repeat(${videos.length}, minmax(min-content, max-content))`,
  };

  return (
    <div id="plugin-pip-webcams" className="webcams" style={style}>
      {videos.sort((video1, video2) => {
        if (video1.userId === currentUser?.userId) {
          return -1;
        }
        if (video2.userId === currentUser?.userId) {
          return 1;
        }
        return 0;
      }).map((video) => (
        <div key={video.streamId} className="pip-video-container">
          <Video srcObject={video.srcObject} talking={video.userTalking} />
          <span className="username">
            {video.userName}
          </span>
        </div>
      ))}
    </div>
  );
}

export default CamerasComponent;
