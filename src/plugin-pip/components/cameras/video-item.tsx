import * as React from 'react';
import Video from './video';

interface VideoItemProps {
  streamId: string;
  srcObject?: MediaStream | null;
  userTalking: boolean;
  userName: string;
  avatar?: string;
  color?: string;
}

function VideoItem({
  streamId, srcObject, userTalking, userName, avatar, color,
}: VideoItemProps) {
  const [squeezed, setSqueezed] = React.useState(false);
  const observerRef = React.useRef<ResizeObserver | null>(null);

  const updateRef = React.useCallback((ref: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (ref) {
      observerRef.current = new ResizeObserver((entries) => {
        setSqueezed(entries[0] && entries[0].contentRect.width < 140);
      });

      observerRef.current.observe(ref);
    }
  }, []);

  const initials = userName.trim().slice(0, 2) || '?';

  return (
    <div
      key={streamId}
      ref={updateRef}
      className={`pip-video-container${userTalking ? ' talking' : ''}`}
    >
      {srcObject ? <Video srcObject={srcObject} talking={userTalking} /> : (
        <div
          className="pip-participant-avatar"
          style={{ backgroundColor: color || '#4b5563' }}
          aria-label={userName}
        >
          {avatar ? <img src={avatar} alt="" /> : initials}
        </div>
      )}
      {!squeezed && (
        <span className="username">
          {userName}
        </span>
      )}
    </div>
  );
}

export default VideoItem;
