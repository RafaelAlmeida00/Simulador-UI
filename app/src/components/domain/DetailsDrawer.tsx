'use client';

import * as React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/src/components/ui/sheet';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Separator } from '@/src/components/ui/separator';
import { cn } from '@/src/lib/utils';

export interface DetailsSection {
  title: string;
  value: unknown;
}

export interface DetailsDrawerProps {
  open: boolean;
  title: string;
  sections: DetailsSection[];
  onClose: () => void;
}

function JsonBlock({ value }: { value: unknown }) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const jsonString = JSON.stringify(value, null, 2);
  const lines = jsonString.split('\n');
  const isLarge = lines.length > 20;

  return (
    <div className="relative">
      {isLarge && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -top-8 right-0 text-xs"
        >
          <ChevronRight
            className={cn(
              'h-3 w-3 mr-1 transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
          {isExpanded ? 'Recolher' : 'Expandir'}
        </Button>
      )}
      <motion.pre
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 100 }}
        className={cn(
          'm-0 p-3 rounded-lg overflow-auto',
          'bg-background/50 border border-border',
          'text-xs font-mono',
          !isExpanded && 'overflow-hidden'
        )}
      >
        <code className="text-foreground">{jsonString}</code>
      </motion.pre>
      {!isExpanded && isLarge && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      )}
    </div>
  );
}

export function DetailsDrawer({ open, title, sections, onClose }: DetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[320px] sm:w-[420px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="truncate pr-4">{title}</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-6 py-4 space-y-6">
            <AnimatePresence mode="wait">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {section.title}
                  </h4>
                  <JsonBlock value={section.value} />
                  {index < sections.length - 1 && <Separator className="mt-4" />}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default DetailsDrawer;
