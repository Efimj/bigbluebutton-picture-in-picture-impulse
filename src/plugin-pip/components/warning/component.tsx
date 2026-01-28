import * as React from 'react';
import { defineMessages, IntlShape } from 'react-intl';

const intlMessages = defineMessages({
  warningTitle: {
    id: 'plugin.warning.title',
    defaultMessage: 'Click anywhere in the document to reactivate focus.',
  },
  warningMessage: {
    id: 'plugin.warning.message',
    defaultMessage: 'This ensures that Picture-in-Picture will be automatically reactivated when you leave this tab again.',
  },
});

interface FocusWarningProps {
  intl: IntlShape;
}

function FocusWarning({ intl }: FocusWarningProps): React.ReactNode {
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#303030',
    padding: '0.5rem',
    maxWidth: '362px',
    height: '75px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  const iconStyle: React.CSSProperties = {
    color: '#f59e0b',
  };

  const titleStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  };

  const messageStyle: React.CSSProperties = {
    color: '#d1d5db',
    fontSize: '0.875rem',
    lineHeight: 1.6,
  };

  return (
    <div style={containerStyle}>
      <div>
        <span style={iconStyle}>⚠</span>
        &nbsp;
        <span style={titleStyle}>{intl.formatMessage(intlMessages.warningTitle)}</span>
      </div>
      <div style={messageStyle}>
        {intl.formatMessage(intlMessages.warningMessage)}
      </div>
    </div>
  );
}

export default FocusWarning;
