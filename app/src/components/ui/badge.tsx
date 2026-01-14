'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        success:
          'border-transparent bg-success text-success-foreground',
        warning:
          'border-transparent bg-warning text-warning-foreground',
        info:
          'border-transparent bg-info text-info-foreground',
        outline:
          'text-foreground border-border',
        // Status badges
        online:
          'border-transparent bg-status-online/20 text-status-online',
        offline:
          'border-transparent bg-status-offline/20 text-status-offline',
        idle:
          'border-transparent bg-status-idle/20 text-status-idle',
        // Severity badges
        low:
          'border-transparent bg-severity-low/20 text-severity-low',
        medium:
          'border-transparent bg-severity-medium/20 text-severity-medium',
        high:
          'border-transparent bg-severity-high/20 text-severity-high',
        planned:
          'border-transparent bg-severity-planned/20 text-severity-planned',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
