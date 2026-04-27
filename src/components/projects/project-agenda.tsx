'use client';

import Link from 'next/link';
import { Project } from '@/lib/types';
import { parseISO, isValid, startOfDay, differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Clock, MapPin, HardHat, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectStatusBadge } from './status-badge';
import { User } from '@/lib/types';

interface ProjectAgendaProps {
  projects: Project[];
  users: User[];
}

function parseDate(raw: any): Date | null {
  if (!raw) return null;
  if (raw instanceof Timestamp) return raw.toDate();
  if (typeof raw === 'string') {
    const d = parseISO(raw.includes('T') ? raw : `${raw}T00:00:00`);
    return isValid(d) ? d : null;
  }
  if (raw?.seconds !== undefined) return new Date(raw.seconds * 1000);
  return null;
}

function getDayLabel(date: Date): string {
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(startOfDay(date), today);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

function getDayBadgeStyle(diff: number): string {
  if (diff === 0) return 'bg-indigo-600 text-white';
  if (diff === 1) return 'bg-emerald-600 text-white';
  if (diff < 0) return 'bg-muted text-muted-foreground';
  return 'bg-amber-500 text-white';
}

export function ProjectAgenda({ projects, users }: ProjectAgendaProps) {
  const today = startOfDay(new Date());

  // Filter: upcoming + active (up to 30 days ahead, and show up to 3 days past)
  const relevant = projects
    .filter((p) => p.status === 'Pendiente' || p.status === 'En Progreso')
    .map((p) => {
      const date = parseDate(p.startDate);
      return { project: p, date };
    })
    .filter(({ date }) => {
      if (!date) return false;
      const diff = differenceInCalendarDays(startOfDay(date), today);
      return diff >= -3 && diff <= 30;
    })
    .sort((a, b) => {
      const timeDiff = (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0);
      if (timeDiff !== 0) return timeDiff;
      // Same day: sort by startTime
      const ta = a.project.startTime ?? '23:59';
      const tb = b.project.startTime ?? '23:59';
      return ta.localeCompare(tb);
    });

  if (relevant.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
        <CalendarClock className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">Sin proyectos próximos</p>
        <p className="text-xs opacity-70">Los proyectos activos en los próximos 30 días aparecerán aquí</p>
      </div>
    );
  }

  // Group by date key
  const grouped: Map<string, typeof relevant> = new Map();
  for (const item of relevant) {
    const key = item.date ? format(item.date, 'yyyy-MM-dd') : 'sin-fecha';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  return (
    <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-12rem)] pr-1">
      {Array.from(grouped.entries()).map(([dateKey, items]) => {
        const date = items[0].date!;
        const diff = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
        const label = getDayLabel(date);
        const badgeStyle = getDayBadgeStyle(diff);

        return (
          <div key={dateKey}>
            {/* Day header */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', badgeStyle)}>
                {label}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {diff === 0 || diff === 1 || diff === -1
                  ? format(date, "EEEE d 'de' MMM", { locale: es })
                  : format(date, 'yyyy', { locale: es })}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Projects for this day */}
            <div className="space-y-2">
              {items.map(({ project }) => {
                const installers = users.filter((u) => project.installerIds?.includes(u.id));
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-indigo-300 hover:shadow-sm active:scale-[0.99]"
                  >
                    {/* Time pill */}
                    <div className="flex flex-col items-center justify-center min-w-[48px] pt-0.5">
                      {project.startTime ? (
                        <>
                          <Clock className="h-3 w-3 text-indigo-500 mb-0.5" />
                          <span className="text-[13px] font-bold text-indigo-600 leading-none">
                            {project.startTime}
                          </span>
                        </>
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
                            {project.projectId}
                          </span>
                          <p className="font-semibold text-sm leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {project.name}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <ProjectStatusBadge status={project.status} className="whitespace-nowrap" />
                        </div>
                      </div>

                      {installers.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <HardHat className="h-3 w-3 shrink-0" />
                          <span className="truncate">{installers.map((u) => u.name).join(', ')}</span>
                        </div>
                      )}

                      {project.locationDetails && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0 mt-px" />
                          <span className="truncate">{project.locationDetails}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
