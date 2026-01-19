// ─────────────────────────────────────────────────────────────
// Session Types
// ─────────────────────────────────────────────────────────────

/**
 * Possible states for a simulation session
 */
export type SessionStatus =
  | 'idle'        // Created but not started
  | 'running'     // Active simulation
  | 'paused'      // Paused by user
  | 'stopped'     // Stopped by user
  | 'expired'     // Exceeded duration limit
  | 'interrupted'; // Server restart (24h recovery window)

/**
 * Full session record from the API
 */
export interface Session {
  id: string;
  name: string | null;
  status: SessionStatus;
  durationDays: number;
  speedFactor: number;
  createdAt: string;
  startedAt: string | null;
  expiresAt: string | null;
  interruptedAt: string | null;
}

/**
 * Session limits from the API
 */
export interface SessionLimits {
  maxPerUser: number;
  maxGlobal: number;
  currentUser: number;
  currentGlobal: number;
}

/**
 * Metadata stored in the session store (subset of Session)
 */
export interface SessionMetadata {
  name: string | null;
  status: SessionStatus;
  createdAt: string;
}

/**
 * Payload for creating a new session
 */
export interface CreateSessionPayload {
  name?: string;
  configId?: string;
  durationDays: number;
  speedFactor?: number;
  expiresAt?: number;  // Epoch ms timestamp calculated from durationDays
}

/**
 * Response from GET /api/sessions
 */
export interface SessionsResponse {
  sessions: Session[];
  limits: SessionLimits;
}

/**
 * Payload for session control actions
 */
export interface SessionControlPayload {
  action: 'start' | 'pause' | 'resume' | 'stop';
}

/**
 * Socket event for session status updates
 */
export interface SessionStatusUpdate {
  sessionId: string;
  status: SessionStatus;
  reason?: string;
}

// ─────────────────────────────────────────────────────────────
// Status Badge Configuration
// ─────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive';

export interface StatusConfig {
  label: string;
  variant: BadgeVariant;
  description?: string;
}

export const SESSION_STATUS_CONFIG: Record<SessionStatus, StatusConfig> = {
  idle: {
    label: 'Aguardando',
    variant: 'secondary',
    description: 'Sessao criada, aguardando inicio',
  },
  running: {
    label: 'Executando',
    variant: 'success',
    description: 'Simulacao em andamento',
  },
  paused: {
    label: 'Pausada',
    variant: 'warning',
    description: 'Simulacao pausada pelo usuario',
  },
  stopped: {
    label: 'Parada',
    variant: 'destructive',
    description: 'Simulacao encerrada',
  },
  expired: {
    label: 'Expirada',
    variant: 'destructive',
    description: 'Duracao maxima atingida',
  },
  interrupted: {
    label: 'Interrompida',
    variant: 'warning',
    description: 'Servidor reiniciado - recuperacao disponivel por 24h',
  },
};
