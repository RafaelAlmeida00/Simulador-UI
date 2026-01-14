'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Erro de Configuração',
    description: 'Há um problema com a configuração do servidor de autenticação.',
  },
  AccessDenied: {
    title: 'Acesso Negado',
    description: 'Você não tem permissão para acessar este recurso.',
  },
  Verification: {
    title: 'Erro de Verificação',
    description: 'O link de verificação pode ter expirado ou já foi usado.',
  },
  OAuthSignin: {
    title: 'Erro OAuth',
    description: 'Erro ao iniciar o processo de autenticação OAuth.',
  },
  OAuthCallback: {
    title: 'Erro de Callback',
    description: 'Erro ao processar a resposta do provedor OAuth.',
  },
  OAuthCreateAccount: {
    title: 'Erro ao Criar Conta',
    description: 'Não foi possível criar uma conta usando OAuth.',
  },
  EmailCreateAccount: {
    title: 'Erro ao Criar Conta',
    description: 'Não foi possível criar uma conta usando email.',
  },
  Callback: {
    title: 'Erro de Callback',
    description: 'Erro no processo de callback da autenticação.',
  },
  OAuthAccountNotLinked: {
    title: 'Conta Não Vinculada',
    description: 'Este email já está associado a outra conta. Faça login usando o método original.',
  },
  SessionRequired: {
    title: 'Sessão Necessária',
    description: 'Você precisa estar autenticado para acessar esta página.',
  },
  Default: {
    title: 'Erro de Autenticação',
    description: 'Ocorreu um erro durante o processo de autenticação.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 w-full max-w-md px-4"
    >
      <Card glass className="backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/20"
          >
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </motion.div>
          <div>
            <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
            <CardDescription className="mt-2">{errorInfo.description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button asChild className="w-full" variant="outline">
            <a href="/auth/signin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Login
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="relative z-10 w-full max-w-md px-4">
      <Card glass className="backdrop-blur-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-destructive/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-destructive/10 blur-3xl" />
      </div>

      <React.Suspense fallback={<LoadingFallback />}>
        <ErrorContent />
      </React.Suspense>
    </div>
  );
}
