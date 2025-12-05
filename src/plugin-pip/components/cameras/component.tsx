import * as React from 'react';
import { useEffect } from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { useVideoStreams } from './hooks';
import Video from './video';

const createVideoSelector = (streamId: string) => `.video-provider_list .videoContainer[data-stream="${streamId}"] video`;

const pollForVideoSrc = (
  streamId: string,
  container: Element = document.body,
): Promise<MediaProvider> => new Promise((resolve, reject) => {
  const TIMEOUT = 5000; // 5 seconds
  const start = performance.now();
  const selector = createVideoSelector(streamId);

  const poll = (timestamp: number) => {
    const element = container.querySelector(selector);
    if (element && element instanceof HTMLVideoElement && element.srcObject) {
      return resolve(element.srcObject);
    }
    if (timestamp - start > TIMEOUT) {
      return reject();
    }
    return requestAnimationFrame(poll);
  };

  requestAnimationFrame(poll);
});

const VIDEO_LIST_CLASSNAME = 'video-provider_list';

interface Media {
  srcObject: MediaProvider;
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

  const {
    data: videoStreamsData,
  } = useVideoStreams(pluginApi);
  const { data: currentUser } = pluginApi.useCurrentUser();

  useEffect(() => {
    async function update() {
      const videoList = document.getElementsByClassName(VIDEO_LIST_CLASSNAME)[0];
      const streams = videoStreamsData?.user_camera || [];
      const newVideos: Media[] = [];

      const videosSrc = streams.map(
        async (stream) => {
          const existingVideo = videos.find((video) => video.streamId === stream.streamId);

          const srcObject = existingVideo
            ? existingVideo.srcObject
            : await pollForVideoSrc(stream.streamId, videoList);

          return {
            streamId: stream.streamId,
            userName: stream.user.name,
            userId: stream.user.userId,
            userTalking: stream?.voice?.talking,
            srcObject,
          };
        },
      );

      const videosResolved = await Promise.all(videosSrc);
      videosResolved.forEach(({
        srcObject, streamId, userName, userId, userTalking,
      }) => {
        newVideos.push({
          srcObject,
          streamId,
          userName,
          userId,
          userTalking,
        });
      });

      setVideos(newVideos);
    }

    update();
  }, [videoStreamsData]);

  if (!videos.length) {
    return null;
  }

  return (
    <div id="plugin-pip-webcams" className="webcams">
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
