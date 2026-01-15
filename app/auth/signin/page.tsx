'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Chrome, AlertCircle, Factory, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';
import { LoadingModal } from '@/src/components/feedback';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingType, setLoadingType] = React.useState<'auth' | 'data'>('auth');
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoadingType('auth');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          callbackUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Erro ao fazer login');
        setIsLoading(false);
      } else if (data.success) {
        router.push(data.callbackUrl || callbackUrl);
      }
    } catch {
      setFormError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingType('auth');
    setIsLoading(true);
    await signIn('google', { callbackUrl });
  };

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'OAuthAccountNotLinked':
        return 'Este email já está vinculado a outra conta.';
      case 'OAuthSignin':
        return 'Erro ao conectar com o provedor OAuth.';
      case 'OAuthCallback':
        return 'Erro no callback do OAuth.';
      case 'Callback':
        return 'Erro no processo de autenticação.';
      default:
        return errorCode;
    }
  };

  return (
    <>
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
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20"
            >
              <Factory className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl">Plant Simulator</CardTitle>
              <CardDescription className="mt-2">
                Faça login para acessar o painel de monitoramento
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error messages */}
            {(error || formError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg bg-destructive/20 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{getErrorMessage(error) || formError}</span>
              </motion.div>
            )}

            {/* Credentials form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                loading={isLoading && loadingType === 'auth'}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
              </div>
            </div>

            {/* Google sign in */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Entrar com Google
            </Button>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <a
                href="/auth/register"
                className="font-medium text-primary hover:underline"
              >
                Registre-se
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          Plant Floor Monitoring System • v2.0
        </motion.p>
      </motion.div>

      {/* Loading Modal */}
      <LoadingModal open={isLoading} context={loadingType} />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="relative z-10 w-full max-w-md px-4">
      <Card glass className="backdrop-blur-xl">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <React.Suspense fallback={<LoadingFallback />}>
        <SignInContent />
      </React.Suspense>
    </div>
  );
}
