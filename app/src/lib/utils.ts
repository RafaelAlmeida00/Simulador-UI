import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number with locale-aware thousands separator
 */
export function formatNumber(value: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Debounce function for optimizing frequent calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get severity color based on value
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'var(--color-severity-low)',
    medium: 'var(--color-severity-medium)',
    high: 'var(--color-severity-high)',
    planned: 'var(--color-severity-planned)',
  };
  return colors[severity.toLowerCase()] || colors.medium;
}

/**
 * Get OEE color based on percentage
 */
export function getOEEColor(value: number): string {
  if (value >= 85) return 'var(--color-success)';
  if (value >= 60) return 'var(--color-warning)';
  return 'var(--color-destructive)';
}

/**
 * Check if value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
