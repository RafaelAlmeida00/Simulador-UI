/**
 * Token Revocation Module
 *
 * Provides server-side token revocation capabilities.
 * Uses in-memory storage with TTL cleanup (suitable for single-server deployments).
 *
 * For multi-server deployments, replace with Redis or similar distributed cache.
 */

// ============================================
// Configuration
// ============================================

// Default TTL: 30 days (should match JWT expiration)
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Cleanup interval: 1 hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// ============================================
// In-Memory Revocation Store
// ============================================

interface RevokedToken {
  jti: string;
  revokedAt: number;
  expiresAt: number;
  userId?: string;
  reason?: string;
}

// Map of JTI -> revocation info
const revocationList = new Map<string, RevokedToken>();

// Track user tokens for bulk revocation
const userTokens = new Map<string, Set<string>>();

// ============================================
// Core Functions
// ============================================

/**
 * Revoke a specific token by JTI
 *
 * @param jti - JWT Token ID
 * @param options - Optional metadata
 */
export async function revokeToken(
  jti: string,
  options?: {
    userId?: string;
    reason?: string;
    expiresAt?: Date;
  }
): Promise<void> {
  const now = Date.now();
  const expiresAt = options?.expiresAt
    ? options.expiresAt.getTime()
    : now + DEFAULT_TTL_MS;

  // Don't store if already expired
  if (expiresAt <= now) {
    return;
  }

  const entry: RevokedToken = {
    jti,
    revokedAt: now,
    expiresAt,
    userId: options?.userId,
    reason: options?.reason,
  };

  revocationList.set(jti, entry);

  // Track by user for bulk revocation
  if (options?.userId) {
    const tokens = userTokens.get(options.userId) || new Set();
    tokens.add(jti);
    userTokens.set(options.userId, tokens);
  }

  console.log(`[TOKEN] Revoked token: ${jti.substring(0, 8)}... (reason: ${options?.reason || 'logout'})`);
}

/**
 * Check if a token has been revoked
 *
 * @param jti - JWT Token ID
 * @returns true if token is revoked
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const entry = revocationList.get(jti);

  if (!entry) {
    return false;
  }

  // Check if revocation entry has expired
  if (entry.expiresAt < Date.now()) {
    // Cleanup expired entry
    revocationList.delete(jti);
    return false;
  }

  return true;
}

/**
 * Revoke all tokens for a user (force logout from all sessions)
 *
 * @param userId - User ID
 * @param reason - Reason for revocation
 */
export async function revokeAllUserTokens(
  userId: string,
  reason = 'force_logout'
): Promise<number> {
  const tokens = userTokens.get(userId);

  if (!tokens || tokens.size === 0) {
    return 0;
  }

  let count = 0;
  const now = Date.now();

  for (const jti of tokens) {
    // Only revoke if not already expired
    const existing = revocationList.get(jti);
    if (!existing || existing.expiresAt > now) {
      await revokeToken(jti, { userId, reason });
      count++;
    }
  }

  console.log(`[TOKEN] Revoked ${count} tokens for user: ${userId.substring(0, 8)}...`);

  return count;
}

/**
 * Get revocation statistics
 */
export function getRevocationStats(): {
  totalRevoked: number;
  usersWithRevokedTokens: number;
} {
  return {
    totalRevoked: revocationList.size,
    usersWithRevokedTokens: userTokens.size,
  };
}

// ============================================
// Cleanup
// ============================================

/**
 * Remove expired entries from the revocation list
 */
export function cleanupExpiredTokens(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [jti, entry] of revocationList) {
    if (entry.expiresAt < now) {
      revocationList.delete(jti);

      // Also clean from user tokens
      if (entry.userId) {
        const tokens = userTokens.get(entry.userId);
        if (tokens) {
          tokens.delete(jti);
          if (tokens.size === 0) {
            userTokens.delete(entry.userId);
          }
        }
      }

      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[TOKEN] Cleaned up ${cleaned} expired revocation entries`);
  }

  return cleaned;
}

// ============================================
// Auto-Cleanup (Server-Side Only)
// ============================================

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic cleanup of expired tokens
 * Call this once when the server starts
 */
export function startCleanupScheduler(): void {
  if (cleanupInterval) {
    return; // Already running
  }

  // Run cleanup on interval
  cleanupInterval = setInterval(() => {
    cleanupExpiredTokens();
  }, CLEANUP_INTERVAL_MS);

  // Don't prevent Node from exiting
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  console.log('[TOKEN] Started revocation cleanup scheduler');
}

/**
 * Stop automatic cleanup
 */
export function stopCleanupScheduler(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[TOKEN] Stopped revocation cleanup scheduler');
  }
}

// Auto-start cleanup in server environment
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startCleanupScheduler();
}

// ============================================
// Export Types
// ============================================

export type { RevokedToken };
