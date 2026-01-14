'use client';

import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/src/components/layout/ThemeProvider';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error:
            'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive',
          success:
            'group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success',
          warning:
            'group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground group-[.toaster]:border-warning',
          info: 'group-[.toaster]:bg-info group-[.toaster]:text-info-foreground group-[.toaster]:border-info',
        },
      }}
      {...props}
    />
  );
}

// Re-export toast for convenience
export { toast } from 'sonner';
