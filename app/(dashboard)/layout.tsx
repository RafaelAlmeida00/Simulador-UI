'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { Sidebar, Header, PageTransition } from '@/src/components/layout';
import { TooltipProvider } from '@/src/components/ui/tooltip';
import { QueryProvider } from '@/src/components/providers/QueryProvider';
import { SessionChannelProvider } from '@/src/components/providers/SessionChannelProvider';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useSimulatorSelector } from '@/src/hooks/useSimulatorStore';
import { useNotificationEngine } from '@/src/hooks/useNotificationEngine';
import { useSessionGuard } from '@/src/hooks/useSessionGuard';
import { useSessionSocket } from '@/src/hooks/useSessionSocket';
import { useSessionControl } from '@/src/hooks/useSessionsQuery';
import {
  useSessionStore,
  selectCurrentSessionId,
  selectSessionStatus,
} from '@/src/stores/sessionStore';
import { getSocket } from '@/src/utils/socket';
import type { SessionControlPayload } from '@/src/types/session';

// ─────────────────────────────────────────────────────────────
// Loading Skeleton for validation state
// ─────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-border bg-card p-4">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="h-14 border-b border-border bg-card flex items-center px-4 justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inner Dashboard Content (uses React Query hooks)
// ─────────────────────────────────────────────────────────────

function DashboardContent({ children }: { children: React.ReactNode }) {
  // Session state for control actions
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const sessionStatus = useSessionStore(selectSessionStatus);

  // Session control mutation (requires QueryProvider context)
  const { mutate: controlSession, isPending: controlPending } = useSessionControl();

  const simHealth = useSimulatorSelector((s) => s.health);
  const simConnect = useSimulatorSelector((s) => s.connected);

  // Activate notification engine to watch simulator state and generate notifications
  useNotificationEngine();

  useEffect(() => {
    getSocket();
  }, []);

  // Handle simulator control actions
  const handleSimulatorControl = React.useCallback(
    (action: 'start' | 'pause' | 'stop') => {
      if (!currentSessionId) return;

      // Map 'start' when paused to 'resume' for API compatibility
      let apiAction: SessionControlPayload['action'] = action;
      if (action === 'start' && sessionStatus === 'paused') {
        apiAction = 'resume';
      }

      controlSession(
        { sessionId: currentSessionId, action: apiAction },
        {
          onError: (error) => {
            console.error(`Session ${action} failed:`, error);
          },
        }
      );
    },
    [currentSessionId, sessionStatus, controlSession]
  );

  // Derive display status: prefer session status, fallback to health data
  const displayStatus = React.useMemo(() => {
    if (sessionStatus && sessionStatus !== 'idle') {
      return sessionStatus as 'running' | 'paused' | 'stopped';
    }
    const healthStatus = simHealth?.data?.simulatorStatus;
    if (healthStatus === 'running' || healthStatus === 'paused' || healthStatus === 'stopped') {
      return healthStatus;
    }
    return 'stopped';
  }, [sessionStatus, simHealth?.data?.simulatorStatus]);

  return (
    <SessionChannelProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            connected={simConnect}
            simulatorTime={simHealth?.data?.simulatorTimestamp}
            simulatorStatus={displayStatus}
            onSimulatorControl={handleSimulatorControl}
            controlPending={controlPending}
          />
          <main className="flex-1 overflow-auto">
            <PageTransition>
              <div className="p-6">{children}</div>
            </PageTransition>
          </main>
        </div>
      </div>
    </SessionChannelProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Layout Component (provides QueryProvider context)
// ─────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session validation - MUST be called first, before other hooks
  const { validating, sessionValid } = useSessionGuard();

  // Session socket connection - only active when session is valid
  useSessionSocket();

  // Show skeleton while validating session
  if (validating || !sessionValid) {
    return <DashboardSkeleton />;
  }

  return (
    <QueryProvider>
      <TooltipProvider>
        <DashboardContent>{children}</DashboardContent>
      </TooltipProvider>
    </QueryProvider>
  );
}
