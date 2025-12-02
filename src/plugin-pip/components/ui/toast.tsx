import * as React from 'react';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  content: React.ReactNode;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (content: React.ReactNode, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getBackgroundColor = (type: ToastType): string => {
    const colors: Record<ToastType, string> = {
      default: '#303030',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    };
    return colors[type];
  };

  const getIcon = (type: ToastType): string | undefined => {
    const icons: Partial<Record<ToastType, string>> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type];
  };

  const getTransform = () => {
    if (isLeaving) {
      return 'translateX(400px)';
    }
    if (isVisible) {
      return 'translateX(0)';
    }
    return 'translateX(400px)';
  };

  const getOpacity = () => {
    if (isLeaving) {
      return 0;
    }
    if (isVisible) {
      return 1;
    }
    return 0;
  };

  const toastStyles: React.CSSProperties = {
    backgroundColor: getBackgroundColor(toast.type),
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '300px',
    maxWidth: '500px',
    pointerEvents: 'auto',
    transform: getTransform(),
    opacity: getOpacity(),
    transition: 'all 0.3s ease-in-out',
  };

  const iconStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
  };

  const messageStyles: React.CSSProperties = {
    flex: 1,
    fontSize: '14px',
    lineHeight: '1.5',
  };

  const closeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    opacity: isHovering ? 1 : 0.8,
    transition: 'opacity 0.2s',
  };

  return (
    <div style={toastStyles}>
      {getIcon(toast.type) && <div style={iconStyles}>{getIcon(toast.type)}</div>}
      <div style={messageStyles}>{toast.content}</div>
      <button
        type="button"
        onClick={handleClose}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={closeButtonStyles}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyles}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const hideToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = React.useCallback((
    content: React.ReactNode,
    type: ToastType = 'default',
    duration: number = 3000,
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = {
      id,
      content,
      type,
      duration,
    };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  const value = React.useMemo(
    () => ({
      toasts,
      showToast,
      hideToast,
    }),
    [toasts, showToast, hideToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
