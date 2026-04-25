'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
import { ProjectForm } from '@/components/projects/project-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

function generateNextProjectId(existingIds: string[]): string {
  const nums = existingIds
    .map((id) => {
      const match = id.match(/^INST-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `INST-${String(max + 1).padStart(4, '0')}`;
}

export default function NewProjectPage() {
  const { projects, isProjectsLoading, users } = useAppContext();
  const { currentUser } = useAuth();
  const router = useRouter();

  const userRoles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const canCreate = userRoles.includes('admin') || userRoles.includes('vendedor');

  // Redirect non-authorized users
  if (!isProjectsLoading && !canCreate) {
    router.replace('/projects');
    return null;
  }

  const installers = useMemo(
    () => users.filter((u) => {
      const roles = u.roles ?? (u.role ? [u.role] : []);
      return roles.includes('instalador');
    }),
    [users]
  );

  const nextProjectId = useMemo(
    () => generateNextProjectId(projects.map((p) => p.projectId)),
    [projects]
  );

  if (isProjectsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 md:p-6 lg:p-8 max-w-3xl">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/projects" aria-label="Volver a proyectos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <p className="text-xs text-muted-foreground font-mono tracking-widest mb-0.5">
            {nextProjectId}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Nuevo Proyecto
          </h1>
        </div>
      </div>

      {/* Form */}
      <ProjectForm installers={installers} nextProjectId={nextProjectId} />
    </div>
  );
}
