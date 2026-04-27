'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
import { ProjectList } from '@/components/projects/project-list';
import { ProjectAgenda } from '@/components/projects/project-agenda';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Loader2, CalendarClock } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, isProjectsLoading, users } = useAppContext();
  const { currentUser } = useAuth();
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);

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

  const agendaPanel = (
    <ProjectAgenda projects={projects} users={users} />
  );

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

        <div className="flex items-center gap-2">
          {/* Agenda button: icon-only on mobile, text on desktop */}
          <Sheet open={isAgendaOpen} onOpenChange={setIsAgendaOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Ver agenda">
                <CalendarClock className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[400px] flex flex-col">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-indigo-500" />
                  Agenda de Instalaciones
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex-1 overflow-hidden">
                {agendaPanel}
              </div>
            </SheetContent>
          </Sheet>

          {canCreate && (
            <Button asChild className="hidden md:flex shrink-0">
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-1.5" />
                Nuevo Proyecto
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Main layout: list + sidebar agenda on large screens */}
      <div className="flex gap-6">
        {/* Project List */}
        <div className="flex-1 min-w-0">
          <ProjectList
            projects={projects}
            users={users}
            installers={installers}
          />
        </div>

        {/* Agenda Sidebar — visible only on lg+ */}
        <aside className="hidden lg:flex flex-col w-[320px] shrink-0">
          <div className="sticky top-6 rounded-xl border border-border bg-card shadow-sm p-4">
            <h2 className="flex items-center gap-2 font-semibold text-sm mb-4">
              <CalendarClock className="h-4 w-4 text-indigo-500" />
              Agenda Próxima
            </h2>
            {agendaPanel}
          </div>
        </aside>
      </div>

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
