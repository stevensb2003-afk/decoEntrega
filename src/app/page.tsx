'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { currentUser, isUserLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is done and we have a user, redirect them based on role.
    if (!isUserLoading && currentUser) {
      const userRoles = currentUser.roles || (currentUser.role ? [currentUser.role] : []);
      const isOnlyInstaller = userRoles.includes('instalador') && userRoles.length === 1;

      if (isOnlyInstaller) {
        router.replace('/projects');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [currentUser, isUserLoading, router]);

  // While loading, or if the user is already logged in (and the redirect is in progress), show a spinner.
  if (isUserLoading || currentUser) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </main>
    );
  }

  // If loading is done and there's no user, show the login form.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center justify-center text-center">
          <Logo className="w-16 h-16" />
          <h1 className="text-2xl font-bold font-headline">DecoEntrega</h1>
          <p className="text-muted-foreground">
            Inicia sesión en tu cuenta para continuar.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
