// Custom Hooks

// Simulator Store (Zustand + WebSocket)
export * from './useSimulatorStore';

// Session ID Utility
export * from './useSessionId';

// React Query Hooks (REST API - all session-scoped)
export * from './useEventsQuery';
export * from './useStopsQuery';
export * from './useOEEQuery';
export * from './useMTTRMTBFQuery';
export * from './useSessionsQuery';
export * from './useConfigsQuery';

// Session Management
export * from './useSessionGuard';
export * from './useSessionSocket';

// Notification Engine
export * from './useNotificationEngine';

// Keyboard Shortcuts (used by GlobalSearch)
export * from './useKeyboardShortcut';

// Navigation Keys (WASD/Arrows for dashboard navigation)
export * from './useNavigationKeys';
