'use client';

import * as React from 'react';
import { useSimulatorSelector } from './useSimulatorStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import type { IStopLine, HealthData } from '@/src/types/socket';

// Configuration for notification rules
const CONFIG = {
  BUFFER_HIGH_THRESHOLD: 0.90,
  BUFFER_CRITICAL_THRESHOLD: 0.95,
  BUFFER_LOW_THRESHOLD: 0.10,
  OEE_TARGET: 85,
  OEE_WARNING_DIFF: 5,
  OEE_CRITICAL_DIFF: 15,
  DEBOUNCE_MS: 1000000, // 1000 seconds between similar notifications
};

// Debounce map to avoid notification spam
const notifiedKeys = new Map<string, number>();

function shouldNotify(key: string): boolean {
  const lastTime = notifiedKeys.get(key);
  if (!lastTime) return true;
  return Date.now() - lastTime > CONFIG.DEBOUNCE_MS;
}

function markNotified(key: string): void {
  notifiedKeys.set(key, Date.now());
}

export function useNotificationEngine() {
  const stopsState = useSimulatorSelector((s) => s.stopsState);
  const buffersState = useSimulatorSelector((s) => s.buffersState);
  const oeeState = useSimulatorSelector((s) => s.oeeState);
  const health = useSimulatorSelector((s) => s.health);

  const addNotification = useNotificationStore((s) => s.add);

  // Refs to track previous state and initialization
  const initializedRef = React.useRef(false);
  const prevStopsRef = React.useRef<IStopLine[]>([]);
  const prevHealthStatusRef = React.useRef<string | null>(null);

  // Cleanup stale debounce entries to prevent memory leaks
  React.useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamp] of notifiedKeys.entries()) {
        if (now - timestamp > CONFIG.DEBOUNCE_MS * 2) {
          notifiedKeys.delete(key);
        }
      }
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // RULE 1: High/Medium severity stops (new stops only)
  // ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!initializedRef.current) {
      prevStopsRef.current = stopsState;
      initializedRef.current = true;
      return;
    }

    // Detect NEW stops (not in previous state)
    const prevIds = new Set(prevStopsRef.current.map((s) => s.id));
    const newStops = stopsState.filter(
      (s) => !prevIds.has(s.id) && s.status === 'IN_PROGRESS'
    );

    for (const stop of newStops) {
      if (stop.severity === 'HIGH') {
        const key = `stop-high-${stop.shop}-${stop.line}-${stop.station}`;
        if (shouldNotify(key)) {
          addNotification({
            category: 'STOP',
            severity: 'critical',
            title: `Parada Critica - ${stop.station}`,
            message: `${stop.line}: ${stop.reason || 'Sem motivo informado'}`,
            metadata: { shop: stop.shop, line: stop.line, station: stop.station, stopId: stop.id },
          });
          markNotified(key);
        }
      } else if (stop.severity === 'MEDIUM') {
        const key = `stop-medium-${stop.shop}-${stop.line}-${stop.station}`;
        if (shouldNotify(key)) {
          addNotification({
            category: 'STOP',
            severity: 'warning',
            title: `Parada - ${stop.station}`,
            message: `${stop.line}: ${stop.reason || 'Sem motivo informado'}`,
            metadata: { shop: stop.shop, line: stop.line, station: stop.station, stopId: stop.id },
          });
          markNotified(key);
        }
      }
    }

    prevStopsRef.current = stopsState;
  }, [stopsState, addNotification]);

  // ─────────────────────────────────────────────────────────────
  // RULE 2: Buffer capacity alerts
  // ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    for (const buffer of buffersState) {
      if (buffer.capacity === 0) continue;

      const utilization = buffer.currentCount / buffer.capacity;
      const key = `buffer-${buffer.id}`;

      if (utilization >= CONFIG.BUFFER_CRITICAL_THRESHOLD) {
        if (shouldNotify(`${key}-critical`)) {
          addNotification({
            category: 'BUFFER',
            severity: 'critical',
            title: `Buffer Critico - ${buffer.id}`,
            message: `Capacidade em ${Math.round(utilization * 100)}% (${buffer.currentCount}/${buffer.capacity})`,
            metadata: { bufferId: buffer.id, utilization, from: buffer.from, to: buffer.to },
          });
          markNotified(`${key}-critical`);
        }
      } else if (utilization >= CONFIG.BUFFER_HIGH_THRESHOLD) {
        if (shouldNotify(`${key}-warning`)) {
          addNotification({
            category: 'BUFFER',
            severity: 'warning',
            title: `Buffer Alto - ${buffer.id}`,
            message: `Capacidade em ${Math.round(utilization * 100)}% (${buffer.currentCount}/${buffer.capacity})`,
            metadata: { bufferId: buffer.id, utilization, from: buffer.from, to: buffer.to },
          });
          markNotified(`${key}-warning`);
        }
      } else if (utilization <= CONFIG.BUFFER_LOW_THRESHOLD && buffer.currentCount > 0) {
        // Buffer starving (low but not empty)
        if (shouldNotify(`${key}-starving`)) {
          addNotification({
            category: 'BUFFER',
            severity: 'warning',
            title: `Buffer Baixo - ${buffer.id}`,
            message: `Apenas ${buffer.currentCount} unidade${buffer.currentCount !== 1 ? 's' : ''} (${Math.round(utilization * 100)}%)`,
            metadata: { bufferId: buffer.id, utilization, from: buffer.from, to: buffer.to },
          });
          markNotified(`${key}-starving`);
        }
      }
    }
  }, [buffersState, addNotification]);

  // ─────────────────────────────────────────────────────────────
  // RULE 3: OEE below target
  // ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    for (const oee of oeeState) {
      const target = CONFIG.OEE_TARGET;
      const diff = target - oee.oee;
      const key = `oee-${oee.shop}-${oee.line}`;

      if (diff >= CONFIG.OEE_CRITICAL_DIFF) {
        if (shouldNotify(`${key}-critical`)) {
          addNotification({
            category: 'OEE',
            severity: 'critical',
            title: `OEE Critico - ${oee.line}`,
            message: `OEE: ${oee.oee.toFixed(1)}% | Target: ${target}%`,
            metadata: { shop: oee.shop, line: oee.line, oee: oee.oee, target },
          });
          markNotified(`${key}-critical`);
        }
      } else if (diff >= CONFIG.OEE_WARNING_DIFF) {
        if (shouldNotify(`${key}-warning`)) {
          addNotification({
            category: 'OEE',
            severity: 'warning',
            title: `OEE Abaixo do Target - ${oee.line}`,
            message: `OEE: ${oee.oee.toFixed(1)}% | Target: ${target}%`,
            metadata: { shop: oee.shop, line: oee.line, oee: oee.oee, target },
          });
          markNotified(`${key}-warning`);
        }
      }
    }
  }, [oeeState, addNotification]);

  // ─────────────────────────────────────────────────────────────
  // RULE 4: Simulator status changes
  // ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const healthData = health?.data as HealthData | undefined;
    const status = healthData?.simulatorStatus;
    if (!status || status === prevHealthStatusRef.current) return;

    // Only notify if status actually changed (not initial load)
    if (prevHealthStatusRef.current !== null) {
      if (status === 'stopped') {
        addNotification({
          category: 'SYSTEM',
          severity: 'warning',
          title: 'Simulador Parado',
          message: 'O simulador foi interrompido',
        });
      } else if (status === 'paused') {
        addNotification({
          category: 'SYSTEM',
          severity: 'info',
          title: 'Simulador Pausado',
          message: 'O simulador esta em pausa',
        });
      } else if (status === 'running' && prevHealthStatusRef.current !== 'running') {
        addNotification({
          category: 'SYSTEM',
          severity: 'info',
          title: 'Simulador Iniciado',
          message: 'O simulador esta em execucao',
        });
      }
    }

    prevHealthStatusRef.current = status;
  }, [health, addNotification]);
}
