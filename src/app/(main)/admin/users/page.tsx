'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/contexts/app-context';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { Loader2 } from 'lucide-react';
import { User } from '@/lib/types';
import { NewUserButton } from '@/components/dashboard/new-user-button';

export default function UserManagementPage() {
  const { currentUser, isUserLoading, hasRole } = useAuth();
  const router = useRouter();
  const { users, isLoading: isAppLoading } = useAppContext();

  useEffect(() => {
    if (!isUserLoading) {
      if (!currentUser) {
          router.replace('/');
      } else if (!hasRole('admin')) {
          router.replace('/dashboard');
      }
    }
  }, [currentUser, isUserLoading, router, hasRole]);

  if (isUserLoading || isAppLoading || !currentUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRole('admin')) {
    return null; // or a nice "access denied" component
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">User Management</h1>
        <NewUserButton />
      </div>
      <UserManagementTable users={users} />
    </div>
  );
}
