'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { VisuallyHidden } from '@/src/components/ui/visually-hidden';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from '@/src/components/ui/command';
import { Button } from '@/src/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { useKeyboardShortcut } from '@/src/hooks/useKeyboardShortcut';
import { useGlobalSearch } from './useGlobalSearch';
import { SearchResultItem } from './SearchResultItem';
import { SearchResultCard } from './SearchResultCard';
import type { SearchResult } from '@/src/types/search';
import { CATEGORY_LABELS } from '@/src/types/search';

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState<SearchResult | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const {
    searchTerm,
    setSearchTerm,
    groupedResults,
    activeCategories,
    isLoading,
    totalResults,
  } = useGlobalSearch(open);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useKeyboardShortcut('k', () => setOpen(true), { ctrl: true, meta: true });

  const handleSelect = React.useCallback((result: SearchResult) => {
    setSelectedResult(result);
    setDetailOpen(true);
  }, []);

  const handleNavigate = React.useCallback(
    (route: string) => {
      router.push(route);
      setDetailOpen(false);
      setOpen(false);
    },
    [router]
  );

  const handleCloseDetail = React.useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset detail state when closing main dialog
      setSelectedResult(null);
      setDetailOpen(false);
    }
  }, []);

  return (
    <>
      {/* Search Trigger Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Busca Global (Ctrl+K)</TooltipContent>
      </Tooltip>

      {/* Command Palette Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Busca Global</DialogTitle>
          </VisuallyHidden>
          <Command className="rounded-xl border-0" shouldFilter={false}>
            <CommandInput
              placeholder="Buscar shops, linhas, estacoes, buffers, carros, OEE, paradas..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[500px]">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Carregando dados...
                </div>
              ) : totalResults === 0 ? (
                <CommandEmpty>
                  {searchTerm
                    ? 'Nenhum resultado encontrado.'
                    : 'Comece a digitar para buscar...'}
                </CommandEmpty>
              ) : (
                activeCategories.map((category) => (
                  <CommandGroup
                    key={category}
                    heading={CATEGORY_LABELS[category]}
                  >
                    {groupedResults[category].slice(0, 5).map((result) => (
                      <SearchResultItem
                        key={result.id}
                        result={result}
                        onSelect={handleSelect}
                      />
                    ))}
                    {groupedResults[category].length > 5 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        +{groupedResults[category].length - 5} mais resultados
                      </div>
                    )}
                  </CommandGroup>
                ))
              )}
            </CommandList>
            {totalResults > 0 && (
              <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado
                {totalResults !== 1 ? 's' : ''}
              </div>
            )}
          </Command>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <VisuallyHidden>
            <DialogTitle>
              {selectedResult ? selectedResult.title : 'Detalhes do Resultado'}
            </DialogTitle>
          </VisuallyHidden>
          {selectedResult && (
            <SearchResultCard
              result={selectedResult}
              onNavigate={handleNavigate}
              onClose={handleCloseDetail}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
