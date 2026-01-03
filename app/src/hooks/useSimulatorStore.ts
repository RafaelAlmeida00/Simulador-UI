'use client';

import * as React from 'react';
import { simulatorStore } from '../stores/simulatorStore';

export function useSimulatorStore() {
  return React.useSyncExternalStore(
    simulatorStore.subscribe,
    simulatorStore.getSnapshot,
    simulatorStore.getSnapshot
  );
}
