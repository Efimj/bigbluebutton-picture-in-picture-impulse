import * as React from 'react';

interface LoaderProps {
  size?: number;
  color?: string;
}

function Loader({
  size = 40,
  color = '#4A90E2',
}: LoaderProps) {
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: `${size}px`,
    height: `${size}px`,
  };

  const spinnerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: `${size / 10}px solid rgba(74, 144, 226, 0.1)`,
    borderTop: `${size / 10}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const pulseStyle: React.CSSProperties = {
    position: 'absolute',
    width: '60%',
    height: '60%',
    backgroundColor: color,
    borderRadius: '50%',
    opacity: 0.2,
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(0.8); opacity: 0.2; }
            50% { transform: scale(1.2); opacity: 0.4; }
          }
        `}
      </style>
      <div style={containerStyle}>
        <div style={pulseStyle} />
        <div style={spinnerStyle} />
      </div>
    </>
  );
}

export default Loader;
