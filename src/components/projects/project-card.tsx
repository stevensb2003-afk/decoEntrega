'use client';

import Link from 'next/link';
import { Project, User } from '@/lib/types';
import { ProjectStatusBadge } from './status-badge';
import { CalendarDays, User2, Phone, HardHat, ArrowRight } from 'lucide-react';
import { format, isSameDay, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface ProjectCardProps {
  project: Project;
  installers: User[];
}

function parseProjectDate(date: any): Date | null {
  if (!date) return null;
  if (date instanceof Timestamp) return date.toDate();
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }
  return null;
}

function formatProjectDates(project: Project): string {
  const start = parseProjectDate(project.startDate);
  const end = project.endDate ? parseProjectDate(project.endDate) : null;

  if (!start) return 'Fecha no definida';

  const startStr = format(start, "d 'de' MMM", { locale: es });

  if (project.isOneDay || !end || (end && isSameDay(start, end))) {
    return startStr;
  }

  const endStr = format(end, "d 'de' MMM, yyyy", { locale: es });
  return `${startStr} → ${endStr}`;
}

export function ProjectCard({ project, installers }: ProjectCardProps) {
  const assignedInstallers = installers.filter((u) =>
    project.installerIds?.includes(u.id)
  );

  const tasksDone = project.tasks?.filter((t) => t.isCompleted).length ?? 0;
  const tasksTotal = project.tasks?.length ?? 0;
  const taskProgress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col h-full rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex flex-col flex-1 p-4">
        {/* Header: ID + Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-semibold text-muted-foreground tracking-wider">
            {project.projectId}
          </span>
          <ProjectStatusBadge status={project.status} />
        </div>

        {/* Project Name */}
        <h3 className="font-semibold text-base leading-snug text-foreground group-hover:text-primary transition-colors mb-3 line-clamp-2">
          {project.name}
        </h3>

        {/* Info Rows */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {/* Customer */}
          <div className="flex items-center gap-2">
            <User2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.customerName}</span>
            {project.customerPhone && (
              <>
                <Phone className="h-3.5 w-3.5 shrink-0 ml-1" />
                <span className="truncate">{project.customerPhone}</span>
              </>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{formatProjectDates(project)}</span>
          </div>

          {/* Installers */}
          {assignedInstallers.length > 0 && (
            <div className="flex items-center gap-2">
              <HardHat className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {assignedInstallers.map((u) => u.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Task Progress */}
        {tasksTotal > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Tareas</span>
              <span>{tasksDone}/{tasksTotal}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer arrow */}
      <div className="flex items-center justify-end px-4 pb-3">
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
    </Link>
  );
}
