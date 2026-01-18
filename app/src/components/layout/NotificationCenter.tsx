'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, AlertTriangle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';
import {
  useNotificationStore,
  selectUnreadCount,
  Notification,
  NotificationCategory,
  NotificationSeverity,
} from '@/src/stores/notificationStore';

const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  STOP: AlertTriangle,
  BUFFER: AlertCircle,
  OEE: Info,
  SYSTEM: Info,
};

const SEVERITY_STYLES: Record<NotificationSeverity, string> = {
  critical: 'border-l-destructive bg-destructive/5',
  warning: 'border-l-warning bg-warning/5',
  info: 'border-l-info bg-info/5',
};

const SEVERITY_ICON_COLORS: Record<NotificationSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
};

// Format relative time without date-fns
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'agora mesmo';
  } else if (diffMinutes < 60) {
    return `ha ${diffMinutes} min`;
  } else if (diffHours < 24) {
    return `ha ${diffHours}h`;
  } else if (diffDays < 7) {
    return `ha ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}

function NotificationItem({
  notification,
  onRead,
  onDismiss,
}: {
  notification: Notification;
  onRead: () => void;
  onDismiss: () => void;
}) {
  const Icon = CATEGORY_ICONS[notification.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'flex gap-3 p-3 border-l-4 rounded-r-md transition-colors',
        SEVERITY_STYLES[notification.severity],
        !notification.read && 'ring-1 ring-primary/20'
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', SEVERITY_ICON_COLORS[notification.severity])} />

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', !notification.read && 'font-medium')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-success/20 hover:text-success"
            onClick={(e) => {
              e.stopPropagation();
              onRead();
            }}
            title="Marcar como lida"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          title="Remover"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export function NotificationCenter() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore(selectUnreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const clear = useNotificationStore((s) => s.clear);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="font-semibold text-sm">Notificacoes</span>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                Marcar todas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={clear}
                title="Limpar todas"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[350px]">
          <div className="p-2 space-y-2">
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificacao</p>
                </motion.div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={() => markAsRead(n.id)}
                    onDismiss={() => dismiss(n.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t p-2 text-center">
            <span className="text-xs text-muted-foreground">
              {notifications.length} notificacao{notifications.length !== 1 ? 'es' : ''}
              {unreadCount > 0 && ` (${unreadCount} nao lida${unreadCount !== 1 ? 's' : ''})`}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
