// Simple global state for database connection status
// Becomes true on first successful HTTP request, false on connection failure

let databaseConnected = false;
const listeners = new Set<() => void>();

export function setDatabaseConnected(connected: boolean): void {
  if (databaseConnected !== connected) {
    databaseConnected = connected;
    listeners.forEach((l) => l());
  }
}

export function isDatabaseConnected(): boolean {
  return databaseConnected;
}

export function subscribeDatabaseStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
