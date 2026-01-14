'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, UserPlus, User, AlertCircle, CheckCircle, Factory } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { LoadingModal } from '@/src/components/feedback';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const passwordRequirements = [
    { label: 'Mínimo 6 caracteres', met: password.length >= 6 },
    { label: 'Senhas coincidem', met: password === confirmPassword && password.length > 0 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-success/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-success/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Conta criada com sucesso!</h1>
          <p className="text-muted-foreground">Redirecionando para o login...</p>
        </motion.div>
      </div>
    );
  }

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
              <CardTitle className="text-2xl">Criar Conta</CardTitle>
              <CardDescription className="mt-2">
                Preencha os dados para criar sua conta
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg bg-destructive/20 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome (opcional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Password requirements */}
              <div className="space-y-2">
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs ${
                      req.met ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        req.met ? 'bg-success' : 'bg-muted-foreground'
                      }`}
                    />
                    {req.label}
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !passwordRequirements.every((r) => r.met)}
                loading={isLoading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Conta
              </Button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <a
                href="/auth/signin"
                className="font-medium text-primary hover:underline"
              >
                Faça login
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
      <LoadingModal open={isLoading} context="auth" />
    </div>
  );
}
