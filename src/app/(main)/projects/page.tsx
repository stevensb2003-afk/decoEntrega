'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
import { ProjectList } from '@/components/projects/project-list';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, isProjectsLoading, users } = useAppContext();
  const { currentUser } = useAuth();

  const userRoles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const canCreate = userRoles.includes('admin') || userRoles.includes('vendedor');

  const installers = useMemo(
    () =>
      users.filter((u) => {
        const roles = u.roles ?? (u.role ? [u.role] : []);
        return roles.includes('instalador');
      }),
    [users]
  );

  if (isProjectsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión de proyectos de instalación
          </p>
        </div>

        {canCreate && (
          <Button asChild className="hidden md:flex shrink-0">
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo Proyecto
            </Link>
          </Button>
        )}
      </div>

      {/* Project List */}
      <ProjectList
        projects={projects}
        users={users}
        installers={installers}
      />

      {/* Floating Action Button (mobile) */}
      {canCreate && (
        <Link
          href="/projects/new"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
          aria-label="Nuevo Proyecto"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}
