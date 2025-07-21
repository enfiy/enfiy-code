/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */

import React, { createContext } from 'react';
import { StreamingState } from '../types.js';

export const StreamingContext = createContext<StreamingState | undefined>(
  undefined,
);

export const useStreamingContext = (): StreamingState => {
  const context = React.useContext(StreamingContext);
  if (context === undefined) {
    throw new Error(
      'useStreamingContext must be used within a StreamingContextProvider',
    );
  }
  return context;
};
