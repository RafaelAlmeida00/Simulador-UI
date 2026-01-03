export function formatSimTime(simulatorTimestamp?: number): string {
  if (!simulatorTimestamp || !Number.isFinite(simulatorTimestamp)) return '--:--:--';
  
  const d = new Date(simulatorTimestamp);

  // Mostra HH:mm:ss calculado em UTC
  return d.toLocaleTimeString("pt-BR", {
    timeZone: "UTC",      // Garante que o horário seja UTC e não o local do browser
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    // hour12: false      // Descomente se quiser forçar o formato 24h (00-23) explicitamente
  });
}

export function formatEpochMs(ms?: number): string {
  if (!ms || !Number.isFinite(ms)) return '';
  const d = new Date(ms);
  return d.toLocaleString();
}
