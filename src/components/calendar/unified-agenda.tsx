'use client';

import Link from 'next/link';
import { Project, Ticket, User } from '@/lib/types';
import { parseISO, isValid, startOfDay, differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Clock, MapPin, HardHat, CalendarClock, Truck, Package, Wrench, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectStatusBadge } from '../projects/status-badge';

interface UnifiedAgendaProps {
  projects: Project[];
  ticketsByDay: Record<string, Ticket[]>;
  users: User[];
  filter: 'all' | 'deliveries' | 'projects';
}

interface AgendaItem {
  type: 'project' | 'ticket';
  id: string;
  displayId: string;
  name: string;
  date: Date;
  time?: string;
  location?: string;
  status: string;
  secondaryInfo?: string;
  raw: Project | Ticket;
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

export function UnifiedAgenda({ projects, ticketsByDay, users, filter }: UnifiedAgendaProps) {
  const today = startOfDay(new Date());

  const agendaItems: AgendaItem[] = [];

  // Add Projects
  if (filter === 'all' || filter === 'projects') {
    projects.forEach(p => {
      if (p.status === 'Completado' || p.status === 'Cancelado') return;
      const date = parseDate(p.startDate);
      if (!date) return;
      
      const diff = differenceInCalendarDays(startOfDay(date), today);
      if (diff < -3 || diff > 30) return;

      const installers = users.filter((u) => p.installerIds?.includes(u.id));

      agendaItems.push({
        type: 'project',
        id: p.id,
        displayId: p.projectId,
        name: p.name,
        date,
        time: p.startTime,
        location: p.locationDetails,
        status: p.status,
        secondaryInfo: installers.map(u => u.name).join(', '),
        raw: p
      });
    });
  }

  // Add Tickets
  if (filter === 'all' || filter === 'deliveries') {
    Object.entries(ticketsByDay).forEach(([dateStr, tickets]) => {
      const date = parseISO(dateStr);
      const diff = differenceInCalendarDays(startOfDay(date), today);
      if (diff < -3 || diff > 30) return;

      tickets.forEach(t => {
        if (t.status === 'Entregado' || t.status === 'Cancelado') return;
        
        const driver = users.find(u => u.id === t.driverId);

        agendaItems.push({
          type: 'ticket',
          id: t.id,
          displayId: t.ticketId,
          name: t.customerName,
          date,
          location: t.locationdetails,
          status: t.status,
          secondaryInfo: driver?.name || 'Sin chofer',
          raw: t
        });
      });
    });
  }

  // Sort: Date -> Time -> Type
  agendaItems.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;

    const ta = a.time ?? '23:59';
    const tb = b.time ?? '23:59';
    const timeDiff = ta.localeCompare(tb);
    if (timeDiff !== 0) return timeDiff;

    return a.type.localeCompare(b.type);
  });

  if (agendaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
        <CalendarClock className="h-12 w-12 opacity-20" />
        <p className="text-sm font-medium">No hay eventos próximos en la agenda</p>
        <p className="text-xs opacity-60">Los proyectos y entregas activas aparecerán aquí</p>
      </div>
    );
  }

  // Group by date key
  const grouped: Map<string, AgendaItem[]> = new Map();
  agendaItems.forEach(item => {
    const key = format(item.date, 'yyyy-MM-dd');
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  });

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateKey, items]) => {
        const date = items[0].date;
        const diff = differenceInCalendarDays(startOfDay(date), today);
        const label = getDayLabel(date);
        const badgeStyle = getDayBadgeStyle(diff);

        return (
          <div key={dateKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Day header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full', badgeStyle)}>
                {label}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {format(date, "EEEE d 'de' MMMM", { locale: es })}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Items for this day */}
            <div className="grid gap-2">
              {items.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.type === 'project' ? `/projects/${item.id}` : `/dashboard?ticket=${item.id}`}
                  className={cn(
                    "group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md active:scale-[0.99]",
                    item.type === 'project' ? "hover:border-indigo-200" : "hover:border-cyan-200"
                  )}
                >
                  {/* Icon/Time Column */}
                  <div className="flex flex-col items-center justify-center min-w-[56px] pt-1">
                    {item.time ? (
                      <>
                        <Clock className="h-3.5 w-3.5 text-indigo-500 mb-1" />
                        <span className="text-sm font-bold text-indigo-600">
                          {item.time}
                        </span>
                      </>
                    ) : (
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.type === 'project' ? "bg-indigo-50 text-indigo-600" : "bg-cyan-50 text-cyan-600"
                      )}>
                        {item.type === 'project' ? <Wrench className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                      </div>
                    )}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {item.type === 'ticket' && <Package className="h-3 w-3 text-cyan-600" />}
                          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                            {item.displayId}
                          </span>
                        </div>
                        <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors truncate">
                          {item.name}
                        </h3>
                      </div>
                      
                      <div className="shrink-0 pt-1">
                        {item.type === 'project' ? (
                          <ProjectStatusBadge status={item.status as any} className="whitespace-nowrap" />
                        ) : (
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            item.status === 'Pendiente' ? "bg-yellow-100 text-yellow-700" :
                            item.status === 'Alistando' ? "bg-blue-100 text-blue-700" :
                            "bg-cyan-100 text-cyan-700"
                          )}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4">
                      {item.secondaryInfo && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {item.type === 'project' ? <HardHat className="h-3.5 w-3.5 shrink-0" /> : <UserIcon className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">{item.secondaryInfo}</span>
                        </div>
                      )}

                      {item.location && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
