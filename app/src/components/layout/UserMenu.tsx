'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  LogOut,
  Camera,
  Pencil,
  Loader2,
  CheckCircle2,
  XCircle,
  ImageIcon,
  ArrowLeftRight,
  MonitorPlay,
} from 'lucide-react';
import { useSessionStore, selectSessionMetadata } from '@/src/stores/sessionStore';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';

type ModalState = 'idle' | 'loading' | 'success' | 'error';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const sessionMetadata = useSessionStore(selectSessionMetadata);
  const clearSession = useSessionStore((s) => s.clearSession);
  const [nameModalOpen, setNameModalOpen] = React.useState(false);
  const [photoModalOpen, setPhotoModalOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newPhotoUrl, setNewPhotoUrl] = React.useState('');
  const [modalState, setModalState] = React.useState<ModalState>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const user = session?.user;

  // Handle session switch
  const handleSwitchSession = () => {
    clearSession();
    router.push('/sessions');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOpenNameModal = () => {
    setNewName(user?.name || '');
    setModalState('idle');
    setErrorMessage('');
    setNameModalOpen(true);
  };

  const handleOpenPhotoModal = () => {
    setNewPhotoUrl(user?.image || '');
    setModalState('idle');
    setErrorMessage('');
    setPhotoModalOpen(true);
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName.trim().length < 2) {
      setErrorMessage('Nome deve ter pelo menos 2 caracteres');
      setModalState('error');
      return;
    }

    setModalState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar nome');
      }

      setModalState('success');

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: newName.trim(),
        },
      });

      // Auto close after success
      setTimeout(() => {
        setNameModalOpen(false);
        setModalState('idle');
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao atualizar nome');
      setModalState('error');
    }
  };

  const handleUpdatePhoto = async () => {
    setModalState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: newPhotoUrl.trim() || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar foto');
      }

      setModalState('success');

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: newPhotoUrl.trim() || null,
        },
      });

      // Auto close after success
      setTimeout(() => {
        setPhotoModalOpen(false);
        setModalState('idle');
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao atualizar foto');
      setModalState('error');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn('relative h-10 w-10 rounded-full p-0', className)}
              >
                <Avatar className="h-10 w-10 border-2 border-primary/20 transition-all hover:border-primary/50">
                  <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Minha conta</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-64">
          {/* User info header */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user.name || 'Usuario'}</p>
                <p className="text-xs leading-none text-muted-foreground truncate max-w-[160px]">
                  {user.email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Actions */}
          <DropdownMenuItem onClick={handleOpenPhotoModal} className="cursor-pointer">
            <Camera className="mr-2 h-4 w-4" />
            Alterar Foto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenNameModal} className="cursor-pointer">
            <Pencil className="mr-2 h-4 w-4" />
            Alterar Nome
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {/* Current Session Info & Switch */}
          {sessionMetadata && (
            <>
              <DropdownMenuLabel className="font-normal py-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MonitorPlay className="h-4 w-4" />
                  <span className="text-xs truncate max-w-[180px]">
                    {sessionMetadata.name || 'Sessao atual'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={handleSwitchSession} className="cursor-pointer">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Trocar Sessao
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal: Alterar Nome */}
      <Dialog open={nameModalOpen} onOpenChange={setNameModalOpen}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence mode="wait">
            {modalState === 'loading' ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Loader2 className="h-8 w-8" />
                </motion.div>
                <p className="mt-4 text-sm text-muted-foreground">Atualizando nome...</p>
              </motion.div>
            ) : modalState === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>
                <p className="mt-4 text-sm font-medium">Nome atualizado com sucesso!</p>
              </motion.div>
            ) : modalState === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive"
                >
                  <XCircle className="h-8 w-8" />
                </motion.div>
                <p className="mt-4 text-sm font-medium text-destructive">{errorMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setModalState('idle')}
                >
                  Tentar novamente
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Alterar Nome
                  </DialogTitle>
                  <DialogDescription>
                    Digite seu novo nome de exibicao
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Seu nome"
                    className="mt-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateName();
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNameModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateName}>Salvar</Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Modal: Alterar Foto */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence mode="wait">
            {modalState === 'loading' ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Loader2 className="h-8 w-8" />
                </motion.div>
                <p className="mt-4 text-sm text-muted-foreground">Atualizando foto...</p>
              </motion.div>
            ) : modalState === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>
                <p className="mt-4 text-sm font-medium">Foto atualizada com sucesso!</p>
              </motion.div>
            ) : modalState === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive"
                >
                  <XCircle className="h-8 w-8" />
                </motion.div>
                <p className="mt-4 text-sm font-medium text-destructive">{errorMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setModalState('idle')}
                >
                  Tentar novamente
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Alterar Foto
                  </DialogTitle>
                  <DialogDescription>
                    Insira a URL da sua nova foto de perfil
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  {/* Preview */}
                  <div className="flex justify-center">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      {newPhotoUrl ? (
                        <AvatarImage src={newPhotoUrl} alt="Preview" />
                      ) : null}
                      <AvatarFallback className="bg-secondary">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <Label htmlFor="photoUrl">URL da imagem</Label>
                    <Input
                      id="photoUrl"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="mt-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdatePhoto();
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Deixe vazio para remover a foto atual
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPhotoModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdatePhoto}>Salvar</Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
