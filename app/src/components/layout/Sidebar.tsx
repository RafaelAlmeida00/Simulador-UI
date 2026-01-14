'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Gauge,
  Timer,
  AlertCircle,
  Calendar,
  Layers,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Factory,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Separator } from '@/src/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { ScrollArea } from '@/src/components/ui/scroll-area';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'OEE', href: '/oee', icon: Gauge },
  { label: 'MTTR / MTBF', href: '/mttr-mtbf', icon: Timer },
  { label: 'Paradas', href: '/stoppages', icon: AlertCircle },
  { label: 'Eventos', href: '/events', icon: Calendar },
  { label: 'Buffers', href: '/buffers', icon: Layers },
  { label: 'Configuracoes', href: '/settings', icon: Settings },
  { label: 'Saude', href: '/health-simulator', icon: Activity },
];

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSignOut?: () => void;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  // Don't render sidebar on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar',
          'transition-colors duration-200'
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Factory className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Simulador</span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    'hover:bg-sidebar-accent',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.href}>{linkContent}</div>;
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* User Section */}
        {user && (
          <div className="p-4">
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent',
                collapsed && 'justify-center'
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user.name?.charAt(0) || user.email?.charAt(0) || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 overflow-hidden"
                  >
                    <p className="truncate text-sm font-medium">{user.name || 'Usuario'}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!collapsed && onSignOut && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onSignOut}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sair</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border border-border bg-card shadow-md',
            'hover:bg-secondary'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </motion.aside>
    </TooltipProvider>
  );
}
