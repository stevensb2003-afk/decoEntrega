'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
import { ProjectDetail } from '@/components/projects/project-detail';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, isUserLoading } = useAuth();
  const { projects, isProjectsLoading, users } = useAppContext();
  const router = useRouter();

  const project = projects.find((p) => p.id === id);

  // Once loaded, if not found redirect back
  useEffect(() => {
    if (!isUserLoading && !isProjectsLoading && !project) {
      router.replace('/projects');
    }
  }, [isUserLoading, isProjectsLoading, project, router]);

  if (isUserLoading || isProjectsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="text-sm">Proyecto no encontrado</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/projects">Volver a proyectos</Link>
        </Button>
      </div>
    );
  }

  return <ProjectDetail project={project} users={users} />;
}
