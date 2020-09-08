/* eslint-disable consistent-return */
/* eslint-disable max-statements */
/* eslint-disable id-length */
/* eslint-disable no-nested-ternary */
import { useRef } from 'react';
import { UIManager } from 'react-native';

export function setAndForwardRef({ getForwardedRef, setLocalRef }) {
  return function forwardRef(ref) {
    const forwardedRef = getForwardedRef();
    setLocalRef(ref);

    // Forward to user ref prop (if one has been specified)
    if (typeof forwardedRef === 'function') {
      // Handle function-based refs. String-based refs are handled as functions.
      forwardedRef(ref);
    } else if (typeof forwardedRef === 'object' && forwardedRef != null) {
      // Handle createRef-based refs
      forwardedRef.current = ref;
    }
  };
}

export function setFocusTo(viewTag) {
  UIManager.updateView(viewTag, 'RCTView', {
    hasTVPreferredFocus: true,
  });
}

export function setNextFocus(viewTag, toViewTag, directions = []) {
  const args = {
    ...(directions.includes('right') && { nextFocusRight: toViewTag }),
    ...(directions.includes('left') && { nextFocusLeft: toViewTag }),
    ...(directions.includes('up') && { nextFocusUp: toViewTag }),
    ...(directions.includes('down') && { nextFocusDown: toViewTag }),
  };

  UIManager.updateView(viewTag, 'RCTView', args);
}
