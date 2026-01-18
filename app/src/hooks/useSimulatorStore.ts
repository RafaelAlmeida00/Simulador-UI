'use client';

import * as React from 'react';
import { SimulatorState, simulatorStore } from '../stores/simulatorStore';

export function useSimulatorSelector<T>(selector: (state: SimulatorState) => T): T {
  // Usar ref para o selector evita re-subscriptions quando inline functions são passadas
  const selectorRef = React.useRef(selector);
  const prevStateRef = React.useRef<SimulatorState | null>(null);
  const prevResultRef = React.useRef<T | null>(null);

  // Atualiza o ref do selector em layout effect (mantém sincronizado sem re-subscription)
  React.useLayoutEffect(() => {
    selectorRef.current = selector;
  });

  const getSnapshot = React.useCallback(() => {
    const currentState = simulatorStore.getSnapshot();

    // Se o estado mudou, recalcula o resultado
    if (prevStateRef.current !== currentState) {
      prevStateRef.current = currentState;
      prevResultRef.current = selectorRef.current(currentState);
    }

    return prevResultRef.current as T;
  }, []); // Sem dependências - evita re-subscription

  return React.useSyncExternalStore(
    simulatorStore.subscribe,
    getSnapshot,
    getSnapshot
  );
}
