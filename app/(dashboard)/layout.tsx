'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { Sidebar, Header, PageTransition } from '@/src/components/layout';
import { TooltipProvider } from '@/src/components/ui/tooltip';
import { QueryProvider } from '@/src/components/providers/QueryProvider';
import { useSimulatorSelector } from '@/src/hooks/useSimulatorStore';
import { useNotificationEngine } from '@/src/hooks/useNotificationEngine';
import { getSocket } from '@/src/utils/socket';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const simHealth = useSimulatorSelector((s) => s.health);
  const simConnect = useSimulatorSelector((s) => s.connected);

  // Activate notification engine to watch simulator state and generate notifications
  useNotificationEngine();

  useEffect(() => {
    getSocket();
  }, []);

  return (
    <QueryProvider>
      <TooltipProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header
              connected={simConnect}
              simulatorTime={simHealth?.data?.simulatorTimestamp}
            />
            <main className="flex-1 overflow-auto">
              <PageTransition>
                <div className="p-6">{children}</div>
              </PageTransition>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </QueryProvider>
  );
}
