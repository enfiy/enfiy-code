/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import React from 'react';

// Hook to return state, state setter, and ref to most up-to-date value of state.
// We need this in order to setState and reference the updated state multiple
// times in the same function.
export const useStateAndRef = <
  // Everything but function.
  T extends object | null | undefined | number | string,
>(
  initialValue: T,
) => {
  const [_, setState] = React.useState<T>(initialValue);
  const ref = React.useRef<T>(initialValue);

  const setStateInternal = React.useCallback<typeof setState>(
    (newStateOrCallback) => {
      let newValue: T;
      if (typeof newStateOrCallback === 'function') {
        newValue = newStateOrCallback(ref.current);
      } else {
        newValue = newStateOrCallback;
      }
      setState(newValue);
      ref.current = newValue;
    },
    [],
  );

  return [ref, setStateInternal] as const;
};
