'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface NavigationArrowsProps {
  /** Callback when previous arrow is clicked */
  onPrevious: () => void;
  /** Callback when next arrow is clicked */
  onNext: () => void;
  /** Accessibility label for previous button */
  previousLabel?: string;
  /** Accessibility label for next button */
  nextLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Visual variant */
  variant?: 'subtle' | 'prominent';
  /** Show previous arrow */
  showPrevious?: boolean;
  /** Show next arrow */
  showNext?: boolean;
}

const bounceLeft = {
  x: [0, -6, 0],
};

const bounceRight = {
  x: [0, 6, 0],
};

const bounceTransition = {
  duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

/**
 * Navigation arrows with subtle bounce animation.
 * Designed to be placed inside a relative-positioned container.
 *
 * @example
 * <div className="relative">
 *   <NavigationArrows
 *     onPrevious={() => setIndex(i - 1)}
 *     onNext={() => setIndex(i + 1)}
 *     previousLabel="Linha anterior"
 *     nextLabel="Proxima linha"
 *   />
 *   <Card>...</Card>
 * </div>
 */
export const NavigationArrows = React.memo(function NavigationArrows({
  onPrevious,
  onNext,
  previousLabel = 'Anterior',
  nextLabel = 'Proximo',
  className,
  variant = 'subtle',
  showPrevious = true,
  showNext = true,
}: NavigationArrowsProps) {
  const baseClasses = cn(
    'absolute top-1/2 -translate-y-1/2 z-10',
    'rounded-full p-2 transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    variant === 'subtle'
      ? 'bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-accent text-muted-foreground hover:text-foreground'
      : 'bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg'
  );

  return (
    <>
      {/* Previous Arrow (Left) */}
      {showPrevious && (
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className={cn(baseClasses, 'left-2', className)}
          aria-label={previousLabel}
          animate={bounceLeft}
          transition={bounceTransition}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
      )}

      {/* Next Arrow (Right) */}
      {showNext && (
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className={cn(baseClasses, 'right-2', className)}
          aria-label={nextLabel}
          animate={bounceRight}
          transition={bounceTransition}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      )}
    </>
  );
});
