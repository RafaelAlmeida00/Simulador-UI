'use client';

import * as React from 'react';
import { SimulatorState, simulatorStore } from '../stores/simulatorStore';

export function useSimulatorSelector<T>(selector: (state: SimulatorState) => T): T {
  const prevStateRef = React.useRef<SimulatorState | null>(null);
  const prevResultRef = React.useRef<T | null>(null);

  const getSnapshot = React.useCallback(() => {
    const currentState = simulatorStore.getSnapshot();

    // Se o estado mudou, recalcula o resultado
    if (prevStateRef.current !== currentState) {
      prevStateRef.current = currentState;
      prevResultRef.current = selector(currentState);
    }

    return prevResultRef.current as T;
  }, [selector]);

  return React.useSyncExternalStore(
    simulatorStore.subscribe,
    getSnapshot,
    getSnapshot
  );
}
