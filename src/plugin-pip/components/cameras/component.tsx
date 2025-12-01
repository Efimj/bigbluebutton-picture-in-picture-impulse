import * as React from 'react';
import { useEffect } from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { VIDEO_STREAMS_SUBSCRIPTION } from './queries';
import { VideoStreamsSubscriptionResult } from './types';

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
}

interface CamerasComponentProps {
  pluginApi: PluginApi;
}

function CamerasComponent({ pluginApi }: CamerasComponentProps): React.ReactNode {
  const [videos, setVideos] = React.useState<Media[]>([]);

  const {
    data: videoStreamsData,
  } = pluginApi.useCustomSubscription<VideoStreamsSubscriptionResult>(
    VIDEO_STREAMS_SUBSCRIPTION,
  );
  const { data: currentUser } = pluginApi.useCurrentUser();

  useEffect(() => {
    async function update() {
      const videoList = document.getElementsByClassName(VIDEO_LIST_CLASSNAME)[0];
      const streams = videoStreamsData?.user_camera || [];
      const newVideos: Media[] = [];

      const videosSrc = streams.map(
        async (stream) => {
          const existingVideo = videos.find((video) => video.streamId === stream.streamId);
          if (existingVideo) {
            return existingVideo;
          }

          const srcObject = await pollForVideoSrc(stream.streamId, videoList);

          return {
            streamId: stream.streamId,
            userName: stream.user.name,
            userId: stream.user.userId,
            srcObject,
          };
        },
      );

      const videosResolved = await Promise.all(videosSrc);
      videosResolved.forEach(({
        srcObject, streamId, userName, userId,
      }) => {
        newVideos.push({
          srcObject,
          streamId,
          userName,
          userId,
        });
      });

      setVideos(newVideos);
    }

    update();
  }, [videoStreamsData]);

  if (!videos.length) {
    return (
      <div id="plugin-pip-webcams" className="webcams">
        <div className="placeholder">
          <i className="icon-bbb-video_off" />
          <span>
            No webcam was shared
          </span>
        </div>
      </div>
    );
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
          <video
            autoPlay
            playsInline
            muted
            ref={(ref) => {
              if (ref && video.srcObject) {
                // eslint-disable-next-line no-param-reassign
                ref.srcObject = video.srcObject;
              }
            }}
          />
          <span className="username">
            {video.userName}
          </span>
        </div>
      ))}
    </div>
  );
}

export default CamerasComponent;
