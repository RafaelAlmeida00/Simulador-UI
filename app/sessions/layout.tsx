'use client';

import * as React from 'react';
import Link from 'next/link';
import { Factory } from 'lucide-react';
import { QueryProvider } from '@/src/components/providers/QueryProvider';
import { UserMenu } from '@/src/components/layout';
import { TooltipProvider } from '@/src/components/ui/tooltip';

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
        {/* Simple Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
            {/* Logo */}
            <Link href="/sessions" className="flex items-center gap-2">
              <Factory className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Plant Simulator</span>
            </Link>

            {/* User Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-screen-xl mx-auto px-4 py-8">
          {children}
        </main>
        </div>
      </TooltipProvider>
    </QueryProvider>
  );
}
