'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppHeader } from '@/components/layout/header';
import { Loader2 } from 'lucide-react';
import { NavPath, navLinksConfig } from '@/lib/types';
import { AppProvider } from '@/contexts/app-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { useAuth } from '@/hooks/use-auth';


export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // This effect handles the case where a user is not logged in at all.
  // It runs once after the initial auth state is determined.
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [isUserLoading, user, router]);

  // While Firebase is determining the auth state, or if there's no user,
  // show a global loader. This prevents rendering the main layout for logged-out users.
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Once the user is confirmed, render the providers and the authenticated layout.
  return (
    <SettingsProvider>
        <AppProvider>
            <AuthenticatedLayout>
                {children}
            </AuthenticatedLayout>
        </AppProvider>
    </SettingsProvider>
  );
}

// This component assumes it's rendered within the necessary providers.
// Its job is to handle role-based logic and redirection.
function AuthenticatedLayout({ children }: { children: React.ReactNode; }) {
    const { currentUser, isUserLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (isUserLoading || !currentUser) return; // Don't do anything while loading or if no user object

      const userRoles = currentUser.roles || (currentUser.role ? [currentUser.role] : []);

      // Admins can access everything.
      if (userRoles.includes('admin')) {
          return;
      }

      // For non-admin users, check if they have access to the current path.
      // We check if the current pathname starts with any of the defined base paths
      let hasAccess = false;
      for (const [path, config] of Object.entries(navLinksConfig)) {
        if (pathname === path || pathname.startsWith(`${path}/`)) {
          if (config.allowedRoles.some((role: any) => userRoles.includes(role))) {
            hasAccess = true;
            break;
          }
        }
      }
      
      if (!hasAccess) {
          let destination = '/';
          // Determine the default page based on role priority
          if (userRoles.includes('vendedor') || userRoles.includes('bodeguero')) {
              destination = '/dashboard';
          } else if (userRoles.includes('chofer')) {
              destination = '/driver';
          } else if (userRoles.includes('instalador')) {
              destination = '/projects';
          }
          
          router.replace(destination);
      }
    }, [isUserLoading, currentUser, pathname, router]);


    if (isUserLoading || !currentUser) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
  
    // If user has access, render the layout and children.
    return (
        <div className="flex min-h-screen w-full flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
        </div>
    );
}

