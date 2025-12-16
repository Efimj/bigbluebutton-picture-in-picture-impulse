import * as React from 'react';

interface VideoProps {
  srcObject: MediaProvider;
}

function Video({ srcObject }: VideoProps) {
  const attachVideo = React.useCallback((ref: HTMLVideoElement | null) => {
    if (ref) {
      // eslint-disable-next-line no-param-reassign
      ref.srcObject = srcObject;
    }
  }, [srcObject]);

  return (
    <video
      autoPlay
      playsInline
      muted
      ref={attachVideo}
    />
  );
}

export default Video;
