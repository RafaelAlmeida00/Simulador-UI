export function formatSimTime(simulatorTimestamp?: number): string {
  if (!simulatorTimestamp || !Number.isFinite(simulatorTimestamp)) return '--:--:--';
  const d = new Date(simulatorTimestamp);
  // Mostra HH:mm:ss
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatEpochMs(ms?: number): string {
  if (!ms || !Number.isFinite(ms)) return '';
  const d = new Date(ms);
  return d.toLocaleString();
}
