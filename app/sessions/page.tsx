'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { SessionCard } from '@/src/components/domain/SessionCard';
import { CreateSessionDialog } from '@/src/components/domain/CreateSessionDialog';
import { LoadingModal } from '@/src/components/feedback';
import {
  useSessions,
  useDeleteSession,
  useSessionControl,
  useRecoverSession,
  useDiscardSession,
} from '@/src/hooks/useSessionsQuery';
import { useSession } from 'next-auth/react';
import { useSessionStore } from '@/src/stores/sessionStore';
import type { Session } from '@/src/types/session';

// ─────────────────────────────────────────────────────────────
// Empty State Component
// ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="rounded-full bg-muted p-6 mb-6">
        <FolderOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Nenhuma sessao encontrada</h3>
      <p className="text-muted-foreground max-w-md">
        Crie sua primeira sessao de simulacao para comecar a monitorar a planta.
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Error State Component
// ─────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="rounded-full bg-destructive/10 p-6 mb-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Erro ao carregar sessoes</h3>
      <p className="text-muted-foreground max-w-md mb-4">
        Nao foi possivel carregar suas sessoes. Tente novamente.
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar novamente
      </Button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Loading Skeleton Component
// ─────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex gap-2 pt-3 border-t">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-9" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  // Queries and Mutations
  const { data, isLoading, isError, refetch, isFetching } = useSessions();
  const deleteSession = useDeleteSession();
  const sessionControl = useSessionControl();
  const recoverSession = useRecoverSession();
  const discardSession = useDiscardSession();
  const { data: authSession } = useSession();

  // Local state
  const [selectingSession, setSelectingSession] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Session | null>(null);
  const [discardTarget, setDiscardTarget] = React.useState<Session | null>(null);

  // Extract data
  const sessions = data?.sessions ?? [];
  const limits = data?.limits ?? null;

  // Handle session selection (open dashboard)
  const handleOpenSession = React.useCallback(
    async (session: Session) => {
      setSelectingSession(true);

      let sessionToOpen = session;

      // If session is idle, start it first
      if (session.status === 'idle') {
        try {
          sessionToOpen = await sessionControl.mutateAsync({
            sessionId: session.id,
            action: 'start',
          });
        } catch (error) {
          console.error('[Sessions] Failed to start session:', error);
          setSelectingSession(false);
          return; // Don't navigate if start fails
        }
      }

      // Store the session in Zustand + cookie
      setSession(sessionToOpen.id, {
        name: sessionToOpen.name,
        status: sessionToOpen.status,
        createdAt: sessionToOpen.createdAt,
      });

      // Small delay to ensure localStorage + cookie are set
      await new Promise((r) => setTimeout(r, 100));

      // Navigate to dashboard
      router.push('/');
    },
    [setSession, router, sessionControl]
  );

  // Handle session control actions
  const handleControl = React.useCallback(
    async (session: Session, action: 'start' | 'pause' | 'resume') => {
      try {
        const updatedSession = await sessionControl.mutateAsync({
          sessionId: session.id,
          action,
        });

        // If starting or resuming, also open the dashboard
        if (action === 'start' || action === 'resume') {
          setSelectingSession(true);
          setSession(updatedSession.id, {
            name: updatedSession.name,
            status: updatedSession.status,
            createdAt: updatedSession.createdAt,
          });
          await new Promise((r) => setTimeout(r, 100));
          router.push('/');
        }
      } catch (error) {
        console.error('[Sessions] Control error:', error);
      }
    },
    [sessionControl, setSession, router]
  );

  // Handle session deletion
  const handleDelete = React.useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await deleteSession.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error('[Sessions] Delete error:', error);
    }
  }, [deleteTarget, deleteSession]);

  // Handle session recovery
  const handleRecover = React.useCallback(
    async (session: Session) => {
      try {
        const userId = authSession?.user?.id;
        if (!userId) throw new Error('Usuário não autenticado');
        const recoveredSession = await recoverSession.mutateAsync({ sessionId: session.id, userId });

        // Open the recovered session
        setSelectingSession(true);
        setSession(recoveredSession.id, {
          name: recoveredSession.name,
          status: recoveredSession.status,
          createdAt: recoveredSession.createdAt,
        });
        await new Promise((r) => setTimeout(r, 100));
        router.push('/');
      } catch (error) {
        console.error('[Sessions] Recover error:', error);
      }
    },
    [recoverSession, setSession, router, authSession]
  );

  // Handle session discard
  const handleDiscard = React.useCallback(async () => {
    if (!discardTarget) return;

    try {
      await discardSession.mutateAsync(discardTarget.id);
      setDiscardTarget(null);
    } catch (error) {
      console.error('[Sessions] Discard error:', error);
    }
  }, [discardTarget, discardSession]);

  // Check if any mutation is in progress
  const isMutating =
    deleteSession.isPending ||
    sessionControl.isPending ||
    recoverSession.isPending ||
    discardSession.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Suas Sessoes</h1>
          <p className="text-muted-foreground mt-1">
            Selecione uma sessao para acessar o dashboard ou crie uma nova.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </Button>
          <CreateSessionDialog limits={limits} onSuccess={() => refetch()} />
        </div>
      </div>

      {/* Limits Info */}
      {limits && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            Suas sessoes:{' '}
            <span className="font-medium text-foreground">
              {limits.currentUser}/{limits.maxPerUser}
            </span>
          </span>
          <span>
            Sessoes globais:{' '}
            <span className="font-medium text-foreground">
              {limits.currentGlobal}/{limits.maxGlobal}
            </span>
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onOpen={() => handleOpenSession(session)}
                onControl={(action) => handleControl(session, action)}
                onDelete={() => setDeleteTarget(session)}
                onRecover={() => handleRecover(session)}
                onDiscard={() => setDiscardTarget(session)}
                disabled={isMutating}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Loading Modal for session selection */}
      <LoadingModal open={selectingSession} context="simulator" />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sessao?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A sessao{' '}
              <span className="font-medium">
                {deleteTarget?.name || `#${deleteTarget?.id.slice(0, 8)}`}
              </span>{' '}
              sera permanentemente excluida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Confirmation Dialog */}
      <AlertDialog
        open={!!discardTarget}
        onOpenChange={(open) => !open && setDiscardTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar sessao interrompida?</AlertDialogTitle>
            <AlertDialogDescription>
              A sessao{' '}
              <span className="font-medium">
                {discardTarget?.name || `#${discardTarget?.id.slice(0, 8)}`}
              </span>{' '}
              foi interrompida por reinicio do servidor. Deseja descartar os
              dados e marcar como encerrada?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
