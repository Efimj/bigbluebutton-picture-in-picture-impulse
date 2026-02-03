import * as React from 'react';
import { defineMessages, IntlShape } from 'react-intl';
import Tooltip from '../../../ui/tooltip';
import { useLayoutContext } from '../../../contexts/layout';

export const intlMessages = defineMessages({
  layoutSwap: {
    id: 'plugin.layout.button.swap',
    defaultMessage: 'Swap layout',
  },
});

interface LayoutButtonComponentProps {
  intl: IntlShape;
}

function LayoutButtonComponent({ intl }: LayoutButtonComponentProps) {
  const { swap, canSwap } = useLayoutContext();

  if (!canSwap) return null;

  const className = ['media-btn'];
  const label = intl.formatMessage(intlMessages.layoutSwap);

  return (
    <Tooltip content={label}>
      {({ children, styles, ...props }) => (
        <button
          {...props}
          className={className.join(' ')}
          type="button"
          onClick={swap}
          style={styles}
        >
          <span className="sr-only">
            {label}
          </span>
          <i className="icon-bbb-refresh" />
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default LayoutButtonComponent;
