import * as React from 'react';
import { usePipWindow } from './pip-window';

interface Rect {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface LayoutContext {
  cameras: Rect;
  screenshare: Rect;
  actions: Rect;
  swapped: boolean;
  swap: () => void;
  canSwap: boolean;
}

const LayoutContext = React.createContext<LayoutContext | null>(null);

export function useLayoutContext(): LayoutContext {
  const layout = React.useContext(LayoutContext);
  if (!layout) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return layout;
}

interface LayoutProviderProps {
  children: React.ReactNode;
  hasScreenshare?: boolean;
  hasCameras?: boolean;
  presenter?: boolean;
  moderator?: boolean;
}

export function LayoutProvider({
  children, hasScreenshare, hasCameras, presenter, moderator,
}: LayoutProviderProps) {
  const pipWindow = usePipWindow();
  const hasScreenshareEnabled = Boolean(hasScreenshare);
  const hasCamerasEnabled = Boolean(hasCameras);
  const swappedFromProps = (presenter || moderator) && hasScreenshareEnabled && hasCamerasEnabled;
  const [swapped, setSwapped] = React.useState<boolean>(Boolean(swappedFromProps));

  const calculateLayout = React.useCallback((shouldSwap: boolean): Pick<LayoutContext, 'actions' | 'screenshare' | 'cameras'> => {
    // Some Chromium forks can return 0x0 for inner size in Document PiP.
    const width = pipWindow.innerWidth
      || pipWindow.document.documentElement.clientWidth
      || 350;
    const height = pipWindow.innerHeight
      || pipWindow.document.documentElement.clientHeight
      || 480;

    const actionsHeight = 56;
    const actionsRect: Rect = {
      x: 0,
      y: Math.max(0, height - actionsHeight),
      width,
      height: actionsHeight,
    };

    const availableHeight = Math.max(height - actionsHeight, 0);

    let screenshareRect: Rect = {
      x: 0, y: 0, width: 0, height: 0,
    };
    let camerasRect: Rect = {
      x: 0, y: 0, width: 0, height: 0,
    };

    if (hasScreenshareEnabled && hasCamerasEnabled) {
      if (height > width) {
        screenshareRect = {
          x: 0,
          y: 0,
          width,
          height: availableHeight * 0.7,
        };
        camerasRect = {
          x: 0,
          y: availableHeight * 0.7,
          width,
          height: availableHeight * 0.3,
        };
      } else {
        screenshareRect = {
          x: 0,
          y: 0,
          width: width * 0.7,
          height: availableHeight,
        };
        camerasRect = {
          x: width * 0.7,
          y: 0,
          width: width * 0.3,
          height: availableHeight,
        };
      }
    } else if (hasScreenshareEnabled) {
      screenshareRect = {
        x: 0,
        y: 0,
        width,
        height: availableHeight,
      };
    } else if (hasCamerasEnabled) {
      camerasRect = {
        x: 0,
        y: 0,
        width,
        height: availableHeight,
      };
    }

    if (shouldSwap && hasCamerasEnabled && hasScreenshareEnabled) {
      const temp = screenshareRect;
      screenshareRect = camerasRect;
      camerasRect = temp;
    }

    return {
      actions: actionsRect,
      screenshare: screenshareRect,
      cameras: camerasRect,
    };
  }, [pipWindow, hasScreenshareEnabled, hasCamerasEnabled]);

  const [layout, setLayout] = React.useState<Pick<LayoutContext, 'actions' | 'screenshare' | 'cameras'>>(
    () => calculateLayout(Boolean(swappedFromProps)),
  );

  React.useEffect(() => {
    setSwapped(Boolean(swappedFromProps));
  }, [swappedFromProps]);

  React.useEffect(() => {
    const handleResize = () => {
      setLayout(calculateLayout(swapped));
    };

    handleResize();

    pipWindow.addEventListener('resize', handleResize);
    return () => {
      pipWindow.removeEventListener('resize', handleResize);
    };
  }, [pipWindow, swapped, calculateLayout]);

  const value = React.useMemo(
    () => ({
      ...layout,
      swapped,
      canSwap: hasCamerasEnabled && hasScreenshareEnabled,
      swap: () => setSwapped((v) => !v),
    }),
    [layout, swapped, hasCamerasEnabled, hasScreenshareEnabled],
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}
