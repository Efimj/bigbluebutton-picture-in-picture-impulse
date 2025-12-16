import * as React from 'react';

const pipWindowContext = React.createContext<Window | null>(null);

export function usePipWindow(): Window {
  const pipWindow = React.useContext(pipWindowContext);
  if (!pipWindow) {
    throw new Error('usePipWindow must be used within a PipWindowProvider');
  }
  return pipWindow;
}

interface PipWindowProviderProps {
  pipWindow: Window;
  children: React.ReactNode;
}

export function PipWindowProvider({ pipWindow, children }: PipWindowProviderProps) {
  return (
    <pipWindowContext.Provider value={pipWindow}>
      {children}
    </pipWindowContext.Provider>
  );
}
