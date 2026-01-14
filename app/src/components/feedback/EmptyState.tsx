'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Inbox,
  Search,
  AlertCircle,
  FileQuestion,
  Database,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

type EmptyStateType = 'empty' | 'search' | 'error' | 'not-found' | 'no-data' | 'offline';

const iconMap: Record<EmptyStateType, LucideIcon> = {
  empty: Inbox,
  search: Search,
  error: AlertCircle,
  'not-found': FileQuestion,
  'no-data': Database,
  offline: WifiOff,
};

const defaultMessages: Record<EmptyStateType, { title: string; description: string }> = {
  empty: {
    title: 'Nenhum item encontrado',
    description: 'Nao ha itens para exibir no momento.',
  },
  search: {
    title: 'Nenhum resultado',
    description: 'Tente ajustar os filtros ou termos de busca.',
  },
  error: {
    title: 'Erro ao carregar',
    description: 'Ocorreu um erro ao carregar os dados. Tente novamente.',
  },
  'not-found': {
    title: 'Pagina nao encontrada',
    description: 'O conteudo que voce procura nao existe ou foi removido.',
  },
  'no-data': {
    title: 'Sem dados',
    description: 'Nao ha dados disponiveis para exibir.',
  },
  offline: {
    title: 'Sem conexao',
    description: 'Verifique sua conexao com a internet e tente novamente.',
  },
};

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  type = 'empty',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const Icon = icon || iconMap[type];
  const defaultMessage = defaultMessages[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary"
      >
        <Icon className="h-8 w-8 text-muted-foreground" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-lg font-semibold"
      >
        {title || defaultMessage.title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-sm text-sm text-muted-foreground"
      >
        {description || defaultMessage.description}
      </motion.p>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={action.onClick}>{action.label}</Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Inline empty state for tables/lists
interface InlineEmptyStateProps {
  message?: string;
  className?: string;
}

export function InlineEmptyState({
  message = 'Nenhum item para exibir',
  className,
}: InlineEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center py-8 text-sm text-muted-foreground',
        className
      )}
    >
      <Inbox className="mr-2 h-4 w-4" />
      {message}
    </div>
  );
}
