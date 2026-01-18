'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationSeverity = 'info' | 'warning' | 'critical';
export type NotificationCategory = 'STOP' | 'BUFFER' | 'OEE' | 'SYSTEM';

export interface Notification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  metadata?: Record<string, unknown>;
}

interface NotificationState {
  notifications: Notification[];

  // Actions
  add: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_NOTIFICATIONS = 50;
const PERSIST_LIMIT = 20;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      add: (notification) => {
        const id = `${notification.category}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        set((state) => ({
          notifications: [
            { ...notification, id, timestamp: Date.now(), read: false },
            ...state.notifications,
          ].slice(0, MAX_NOTIFICATIONS),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      dismiss: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clear: () => set({ notifications: [] }),
    }),
    {
      name: 'simulator-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, PERSIST_LIMIT),
      }),
    }
  )
);

// Selectors
export const selectUnreadCount = (state: NotificationState) =>
  state.notifications.filter((n) => !n.read).length;

export const selectByCategory = (category: NotificationCategory) => (state: NotificationState) =>
  state.notifications.filter((n) => n.category === category);

export const selectUnreadNotifications = (state: NotificationState) =>
  state.notifications.filter((n) => !n.read);
