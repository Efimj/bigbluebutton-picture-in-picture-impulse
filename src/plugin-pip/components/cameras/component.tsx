import * as React from 'react';
import { useEffect } from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { useParticipants, useVideoStreams } from './hooks';
import VideoItem from './video-item';
import Skeleton from '../ui/skeleton';
import { range } from './utils';
import { useLayoutContext } from '../contexts/layout';
import { usePipWindow } from '../contexts/pip-window';

const createVideoSelector = (streamId: string) => `.video-provider_list .videoContainer[data-stream="${streamId}"] video`;

const getVideoSrc = (
  streamId: string,
  container?: Element | null,
): MediaStream | null => {
  const selector = createVideoSelector(streamId);
  const element = (container || document.body).querySelector(selector);
  return element instanceof HTMLVideoElement && element.srcObject
    ? element.srcObject as MediaStream
    : null;
};

const ASPECT_RATIO = 4 / 3;

const calculateOptimalGrid = (
  canvasWidth: number,
  canvasHeight: number,
  gutter: number,
  aspectRatio: number,
  numItems: number,
  columns = 1,
) => {
  const rows = Math.ceil(numItems / columns);
  const gutterTotalWidth = (columns - 1) * gutter;
  const gutterTotalHeight = (rows - 1) * gutter;
  const usableWidth = canvasWidth - gutterTotalWidth;
  const usableHeight = canvasHeight - gutterTotalHeight;
  let cellWidth = Math.floor(usableWidth / columns);
  let cellHeight = Math.ceil(cellWidth / aspectRatio);
  if ((cellHeight * rows) > usableHeight) {
    cellHeight = Math.floor(usableHeight / rows);
    cellWidth = Math.ceil(cellHeight * aspectRatio);
  }
  return {
    columns,
    rows,
    width: (cellWidth * columns) + gutterTotalWidth,
    height: (cellHeight * rows) + gutterTotalHeight,
    filledArea: (cellWidth * cellHeight) * numItems,
  };
};

const findOptimalGrid = (
  gridRect: { width: number; height: number } | null,
  numItems: number,
  gutter: number,
) => {
  if (numItems < 1) {
    return {
      rows: 0,
      filledArea: 0,
      columns: 0,
      height: 0,
      width: 0,
    };
  }

  const canvasWidth = gridRect?.width ?? 0;
  const canvasHeight = gridRect?.height ?? 0;

  const newOptimalGrid = range(1, numItems + 1)
    .reduce((currentGrid, col) => {
      const testGrid = calculateOptimalGrid(
        canvasWidth,
        canvasHeight,
        gutter,
        ASPECT_RATIO,
        numItems,
        col,
      );
      const betterThanCurrent = testGrid.filledArea > currentGrid.filledArea;
      return betterThanCurrent ? testGrid : currentGrid;
    }, {
      rows: 0,
      filledArea: 0,
      columns: 0,
      height: 0,
      width: 0,
    });

  return newOptimalGrid;
};

const extractVideoStreamIds = (container: Element | null): string[] => {
  const items = container ? Array.from(container.querySelectorAll('.videoContainer')) : [];
  return items.map((item) => item.getAttribute('data-stream'));
};

const VIDEO_LIST_CLASSNAME = 'video-provider_list';

interface Media {
  srcObject: MediaStream | null;
  streamId: string;
  userName: string;
  userId: string;
  userTalking: boolean;
  avatar?: string;
  color?: string;
}

interface CamerasComponentProps {
  pluginApi: PluginApi;
}

function CamerasComponent({ pluginApi }: CamerasComponentProps): React.ReactNode {
  const [videos, setVideos] = React.useState<Media[]>([]);
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());
  const { cameras: camerasRect } = useLayoutContext();
  const pipWindow = usePipWindow();
  const camerasRef = React.useRef<HTMLDivElement>(null);
  const webcamsRef = React.useRef<HTMLDivElement>(null);

  const {
    data: videoStreamsData,
    error: videoStreamsError,
  } = useVideoStreams(pluginApi);
  const {
    data: participantsData,
    loading: participantsLoading,
    error: participantsError,
  } = useParticipants(pluginApi);
  // Participant placeholders are the default view and must not wait for the
  // independent camera-stream subscription to finish connecting.
  const loading = participantsLoading;

  useEffect(() => {
    if (loading) return undefined;

    function update() {
      const videoList = document.getElementsByClassName(VIDEO_LIST_CLASSNAME)[0];
      const videoStreamIds = extractVideoStreamIds(videoList);
      const videoIndexes = Object.fromEntries(Object.entries(videoStreamIds)
        .map(([index, streamId]) => ([streamId, Number.parseInt(index, 10)])));
      const streams = videoStreamsData?.user_camera || [];
      const participants = (participantsData?.user || []).filter((user) => !user.bot);

      const videoSrc = streams.map(
        (stream) => {
          const srcObject = getVideoSrc(stream.streamId, videoList);

          if (srcObject) {
            return {
              streamId: stream.streamId,
              userName: stream.user?.name ?? '',
              userId: stream.user?.userId ?? '',
              userTalking: stream.voice?.talking ?? false,
              srcObject,
            };
          }

          return null;
        },
      );

      const actualVideos = videoSrc.filter((v): v is Media => Boolean(v)).sort((a, b) => {
        const indexA = videoIndexes[a.streamId] ?? 0;
        const indexB = videoIndexes[b.streamId] ?? 0;
        return indexA - indexB;
      });
      const usersWithResolvedVideo = new Set(actualVideos.map((video) => video.userId));
      const participantPlaceholders: Media[] = participants
        .filter((participant) => !usersWithResolvedVideo.has(participant.userId))
        .map((participant) => ({
          srcObject: null,
          streamId: `participant-${participant.userId}`,
          userName: participant.name,
          userId: participant.userId,
          userTalking: false,
          avatar: participant.avatar,
          color: participant.color,
        }));

      return {
        tiles: [...actualVideos, ...participantPlaceholders],
        unresolvedStreamCount: Math.max(streams.length - actualVideos.length, 0),
      };
    }

    const { tiles, unresolvedStreamCount } = update();
    setVideos(tiles);

    // Setting HTMLVideoElement.srcObject does not mutate DOM attributes, so a
    // MutationObserver cannot see that transition. Retry only while at least
    // one subscribed stream has not acquired its MediaStream yet.
    const retryTimer = unresolvedStreamCount > 0
      ? window.setTimeout(() => setLastUpdate(Date.now()), 1000)
      : undefined;

    return () => {
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [videoStreamsData, participantsData, loading, lastUpdate]);

  useEffect(() => {
    if (!videoStreamsError && !participantsError) return;
    // Keep PiP usable if one subscription fails: the other source can still
    // provide camera videos or participant placeholders.
    // eslint-disable-next-line no-console
    console.warn('[PiP Plugin] Participant grid subscription failed', {
      videoStreamsError,
      participantsError,
    });
  }, [videoStreamsError, participantsError]);

  useEffect(() => {
    const targetNode = document.getElementsByClassName(VIDEO_LIST_CLASSNAME)[0];
    const config = { attributes: true, childList: true, subtree: true };

    const callback = () => {
      setLastUpdate(Date.now());
    };

    const observer = new MutationObserver(callback);

    if (targetNode) observer.observe(targetNode, config);

    return () => {
      observer.disconnect();
    };
  }, [videoStreamsData]);

  const paddingInline = camerasRef.current ? parseInt(pipWindow.getComputedStyle(camerasRef.current)
    .getPropertyValue('padding-inline'), 10) : 8;
  const paddingBlock = camerasRef.current ? parseInt(pipWindow.getComputedStyle(camerasRef.current)
    .getPropertyValue('padding-block'), 10) : 8;

  const gridGutter = webcamsRef.current ? parseInt(pipWindow.getComputedStyle(webcamsRef.current)
    .getPropertyValue('grid-row-gap'), 10) : 6;

  const optimalGrid = React.useMemo(() => findOptimalGrid(
    {
      width: camerasRect.width - (paddingInline * 2),
      height: camerasRect.height - (paddingBlock * 2),
    },
    videos.length || 4,
    gridGutter,
  ), [camerasRect, videos.length, paddingInline, paddingBlock]);

  if (!videos.length && !loading) {
    return null;
  }

  const style: React.CSSProperties = {
    width: `${optimalGrid.width}px`,
    height: `${optimalGrid.height}px`,
    gridTemplateColumns: `repeat(${optimalGrid.columns}, 1fr)`,
    gridTemplateRows: `repeat(${optimalGrid.rows}, 1fr)`,
  };

  return (
    <div
      className="cameras"
      ref={camerasRef}
      style={{
        position: 'absolute',
        left: camerasRect.x,
        top: camerasRect.y,
        width: camerasRect.width,
        height: camerasRect.height,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div id="plugin-pip-webcams" className="webcams" style={style} ref={webcamsRef}>
        {loading && !videos.length ? Array.from({ length: 4 }).map(() => <Skeleton height="unset" />) : videos.map((video) => (
          <VideoItem
            key={video.streamId}
            streamId={video.streamId}
            srcObject={video.srcObject}
            userTalking={video.userTalking}
            userName={video.userName}
            avatar={video.avatar}
            color={video.color}
          />
        ))}
      </div>
    </div>
  );
}

export default CamerasComponent;
