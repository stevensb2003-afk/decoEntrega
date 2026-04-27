'use client';

import * as React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSunday,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
import { Ticket, Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DayDeliveriesModal } from './day-deliveries-modal';
import { Button } from '../ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Slash,
  AlertTriangle,
  MoreVertical,
  Phone,
  MapPin,
  Truck,
  User as UserIcon,
  Package,
  Wrench,
  Clock,
  List,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { UnifiedAgenda } from './unified-agenda';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { FieldValue } from 'firebase/firestore';
import { useSettingsContext } from '@/contexts/settings-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type CalendarFilter = 'all' | 'deliveries' | 'projects';
type CalendarView = 'month' | 'two-weeks' | 'week';

// ─── helpers ────────────────────────────────────────────────────────────────

function parseProjectDate(raw: any): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (raw.seconds !== undefined) return new Date(raw.seconds * 1000);
  if (typeof raw === 'string') {
    try {
      return parseISO(raw.includes('T') ? raw : `${raw}T00:00:00`);
    } catch {
      return null;
    }
  }
  return null;
}

function getProjectInterval(p: Project): { start: Date; end: Date } | null {
  const start = parseProjectDate(p.startDate);
  if (!start || isNaN(start.getTime())) return null;
  let end = start;
  if (!p.isOneDay && p.endDate) {
    const parsed = parseProjectDate(p.endDate);
    if (parsed && !isNaN(parsed.getTime()) && parsed >= start) end = parsed;
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

/** Splits days array into chunks of 7 (weeks). */
function chunkWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

interface ProjectSegment {
  project: Project;
  startCol: number; // 1-indexed column within the week row
  span: number;     // how many columns it spans
  slot: number;     // vertical row (0 = topmost)
  isStart: boolean; // is this the first week the project appears?
  isEnd: boolean;   // is this the last week the project appears?
}

/**
 * For a given week (array of 7 dates), compute all project segments
 * with assigned vertical slots so they never overlap.
 */
function getWeekSegments(projects: Project[], week: Date[]): ProjectSegment[] {
  const weekStart = week[0];
  const weekEnd = week[week.length - 1];
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  const visible: { project: Project; start: Date; end: Date }[] = [];
  for (const p of projects) {
    const interval = getProjectInterval(p);
    if (!interval) continue;
    if (interval.end < weekStart || interval.start > weekEnd) continue;
    visible.push({ project: p, ...interval });
  }

  // Sort: earlier start, longer duration
  visible.sort((a, b) => {
    const diff = a.start.getTime() - b.start.getTime();
    if (diff !== 0) return diff;
    return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime());
  });

  const segments: ProjectSegment[] = [];
  const slotOccupancy: { slot: number; startCol: number; endCol: number }[] = [];

  for (const item of visible) {
    // Clamp to week boundaries
    const clampedStart = item.start < weekStart ? weekStart : item.start;
    const clampedEnd   = item.end   > weekEnd   ? weekEnd   : item.end;

    const startCol = week.findIndex((d) => isSameDay(d, clampedStart)) + 1;
    const endColDay = week.findIndex((d) => isSameDay(d, clampedEnd));
    const endCol = endColDay === -1 ? week.length : endColDay + 1;
    const span = endCol - startCol + 1;

    // Find free slot
    let slot = 0;
    while (true) {
      const conflict = slotOccupancy.some(
        (o) => o.slot === slot && o.startCol <= endCol && o.endCol >= startCol,
      );
      if (!conflict) break;
      slot++;
    }
    slotOccupancy.push({ slot, startCol, endCol });

    segments.push({
      project: item.project,
      startCol,
      span,
      slot,
      isStart: isSameDay(item.start, clampedStart),
      isEnd: isSameDay(item.end, clampedEnd),
    });
  }

  return segments;
}

// ─── ProjectSpanBar ──────────────────────────────────────────────────────────

interface ProjectSpanBarProps {
  segment: ProjectSegment;
  onClick: () => void;
}

function ProjectSpanBar({ segment, onClick }: ProjectSpanBarProps) {
  const { isStart, isEnd, project } = segment;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          style={{
            gridColumn: `${segment.startCol} / span ${segment.span}`,
            gridRow: segment.slot + 1,
            zIndex: 10,
          }}
          className={cn(
            'text-xs py-[3px] px-2 text-white cursor-pointer truncate',
            'bg-indigo-600 hover:bg-indigo-700 transition-colors',
            isStart && isEnd  && 'rounded mx-1',
            isStart && !isEnd && 'rounded-l ml-1 mr-0',
            !isStart && isEnd && 'rounded-r ml-0 mr-1',
            !isStart && !isEnd && 'rounded-none mx-0',
          )}
        >
          {isStart && (
            <>
              <Wrench className="inline h-2.5 w-2.5 mr-1 opacity-80" />
              {project.projectId} {project.name}
              {project.startTime && (
                <span className="ml-1.5 opacity-90 font-semibold">{project.startTime}</span>
              )}
            </>
          )}
          {!isStart && '\u00A0'}
        </div>
      </TooltipTrigger>
      <TooltipContent className="w-64" side="top" align="center">
        <div className="font-bold text-base mb-1">{project.projectId}</div>
        <div className="text-sm font-medium mb-2">{project.name}</div>
        <div className="space-y-1.5 text-sm">
          {project.startTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-indigo-600">Inicio: {project.startTime} hrs</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <span>{project.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{project.customerPhone}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="flex-1 line-clamp-2">{project.locationDetails}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── WeekRow ─────────────────────────────────────────────────────────────────

interface WeekRowProps {
  week: Date[];
  segments: ProjectSegment[];
  showProjects: boolean;
  showTickets: boolean;
  ticketsByDay: Record<string, Ticket[]>;
  blockedDates: { id: string; reason: string }[];
  maxDeliveries: number;
  currentDate: Date;
  users: any[];
  onDayClick: (day: Date) => void;
  onBlockDate: (day: Date) => void;
  onUnblockDate: (day: Date) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, ticketId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, day: Date) => void;
  onProjectClick: (projectId: string) => void;
  maxSlot: number;
}

function WeekRow({
  week, segments, showProjects, showTickets,
  ticketsByDay, blockedDates, maxDeliveries, currentDate,
  users, onDayClick, onBlockDate, onUnblockDate,
  onDragStart, onDragOver, onDrop, onProjectClick, maxSlot,
}: WeekRowProps) {
  const projectRowCount = maxSlot + 1; // number of slot rows to reserve

  return (
    <div className="relative w-full">
      {/* ── Spanning project bars layer ── */}
      {showProjects && segments.length > 0 && (
        <div
          className="grid grid-cols-7 pointer-events-none"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: `repeat(${projectRowCount}, 22px)`,
            paddingTop: '28px', // space for the day number row
            gap: '2px 0',
          }}
        >
          {segments.map((seg, i) => (
            <div
              key={`${seg.project.id}-${i}`}
              style={{ pointerEvents: 'auto' }}
              className="contents"
            >
              <ProjectSpanBar
                segment={seg}
                onClick={() => onProjectClick(seg.project.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Day cells layer (background + numbers + tickets) ── */}
      <div
        className="grid grid-cols-7 absolute inset-0"
        style={{ zIndex: 1 }}
      >
        {week.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const ticketsForDay = ticketsByDay[dateKey] || [];
          const manualBlock = blockedDates.find((d) => d.id === dateKey);
          const isEffectivelyBlocked = manualBlock
            ? manualBlock.reason !== 'Unblocked by User'
            : isSunday(day);

          const visibleTickets = showTickets ? ticketsForDay : [];
          const isOverbooked = visibleTickets.length > maxDeliveries;
          const canBlockOrUnblock = visibleTickets.length === 0;

          return (
            <div
              key={day.toString()}
              className={cn(
                'border-b border-r flex flex-col group relative',
                !isSameMonth(day, startOfMonth(currentDate)) && 'bg-muted/30 text-muted-foreground',
                isOverbooked && !isEffectivelyBlocked && 'bg-destructive/10',
              )}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, day)}
            >
              {/* Block overlay */}
              {isEffectivelyBlocked && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 5px, hsl(var(--muted)) 5px, hsl(var(--muted)) 10px)',
                    opacity: 0.4,
                  }}
                />
              )}

              {/* Day number */}
              <div className="flex justify-between items-start px-2 pt-1 h-7 relative z-10">
                {isOverbooked && !isEffectivelyBlocked && (
                  <AlertTriangle className="text-destructive h-4 w-4" />
                )}
                <span
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'font-semibold ml-auto text-sm leading-none',
                    isSameDay(day, new Date()) && 'bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center',
                    visibleTickets.length > 0 && 'cursor-pointer',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Spacer to push tickets below project bars */}
              {showProjects && <div style={{ height: `${projectRowCount * 24}px` }} />}

              {/* Delivery tickets */}
              {visibleTickets.length > 0 && (
                <div className="px-1 pb-1 space-y-px relative z-10" onDragOver={onDragOver}>
                  {visibleTickets.map((ticket) => {
                    const isDelivered = ticket.status === 'Entregado';
                    const isCancelled = ticket.status === 'Cancelado';
                    const isDraggable = !isDelivered && !isCancelled;
                    const driver = users.find((u) => u.id === ticket.driverId);
                    const owner = users.find((u) => u.id === ticket.ownerId);
                    let bgColorClass = 'bg-cyan-600 cursor-grab text-white';
                    if (isDelivered) bgColorClass = 'bg-emerald-600 cursor-not-allowed text-white';
                    if (isCancelled) bgColorClass = 'bg-destructive cursor-not-allowed text-destructive-foreground';

                    return (
                      <Tooltip key={ticket.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn('text-xs rounded px-2 py-0.5 truncate', bgColorClass)}
                            draggable={isDraggable}
                            onDragStart={(e) => isDraggable && onDragStart(e, ticket.id)}
                            onDragOver={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ticket.ticketId} - {ticket.customerName}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-64" side="top" align="center">
                          <div className="font-bold text-base mb-2">{ticket.ticketId} - {ticket.customerName}</div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span>{ticket.customerPhone}</span></div>
                            <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /><span className="flex-1">{ticket.locationdetails || 'Sin dirección'}</span></div>
                            <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-muted-foreground" /><span>Chofer: {driver?.name || 'No asignado'}</span></div>
                            <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-muted-foreground" /><span>Vendedor: {owner?.name || 'N/A'}</span></div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}

              {/* Block/Unblock menu */}
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {canBlockOrUnblock && (
                      isEffectivelyBlocked ? (
                        <DropdownMenuItem onClick={() => onUnblockDate(day)}>Desbloquear día</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onBlockDate(day)}>Bloquear día</DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invisible height filler so the row has enough height */}
      <div
        className="grid grid-cols-7 invisible"
        aria-hidden
      >
        {week.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const ticketsForDay = ticketsByDay[dateKey] || [];
          const visibleTickets = showTickets ? ticketsForDay : [];
          return (
            <div
              key={day.toString()}
              style={{ minHeight: showProjects ? `${28 + projectRowCount * 24 + (visibleTickets.length > 0 ? visibleTickets.length * 22 + 8 : 0) + 8}px` : '8rem' }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function FullCalendar() {
  const {
    ticketsByDay,
    blockedDates,
    addBlockedDate,
    removeBlockedDate,
    updateTicket,
    users,
    projects,
  } = useAppContext();
  const { config } = useSettingsContext();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [view, setView] = React.useState<CalendarView>('month');
  const [viewMode, setViewMode] = React.useState<'calendar' | 'agenda'>('calendar');
  const { toast } = useToast();

  const userRoles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const isInstallerOnly =
    userRoles.includes('instalador') &&
    !userRoles.some((r) => ['admin', 'vendedor', 'chofer', 'bodeguero'].includes(r));

  const [filter, setFilter] = React.useState<CalendarFilter>(
    isInstallerOnly ? 'projects' : 'all',
  );

  const maxDeliveries = config?.maxDeliveriesPerDay || 5;

  // ── Visible day range ────────────────────────────────────────────────────
  const { days, headerTitle } = React.useMemo(() => {
    const weekStartsOn = 1 as const;
    let interval: { start: Date; end: Date };
    let headerTitle = '';

    switch (view) {
      case 'week': {
        const s = startOfWeek(currentDate, { weekStartsOn });
        interval = { start: s, end: endOfWeek(currentDate, { weekStartsOn }) };
        headerTitle = `${format(interval.start, 'd MMM', { locale: es })} - ${format(interval.end, 'd MMM, yyyy', { locale: es })}`;
        break;
      }
      case 'two-weeks': {
        const s = startOfWeek(currentDate, { weekStartsOn });
        interval = { start: s, end: endOfWeek(addWeeks(currentDate, 1), { weekStartsOn }) };
        headerTitle = `${format(interval.start, 'd MMM', { locale: es })} - ${format(interval.end, 'd MMM, yyyy', { locale: es })}`;
        break;
      }
      case 'month':
      default: {
        const monthStart = startOfMonth(currentDate);
        interval = {
          start: startOfWeek(monthStart, { weekStartsOn }),
          end: endOfWeek(endOfMonth(monthStart), { weekStartsOn }),
        };
        headerTitle = format(currentDate, 'MMMM yyyy', { locale: es });
      }
    }
    return { days: eachDayOfInterval(interval), headerTitle };
  }, [currentDate, view]);

  const weeks = React.useMemo(() => chunkWeeks(days), [days]);

  const showProjects = filter === 'all' || filter === 'projects';
  const showTickets = filter === 'all' || filter === 'deliveries';

  // Compute segments per week + global maxSlot
  const weekData = React.useMemo(() => {
    return weeks.map((week) => {
      const segments = showProjects ? getWeekSegments(projects, [...week]) : [];
      return { week, segments };
    });
  }, [weeks, projects, showProjects]);

  const globalMaxSlot = React.useMemo(() => {
    let max = -1;
    for (const { segments } of weekData) {
      for (const s of segments) {
        if (s.slot > max) max = s.slot;
      }
    }
    return max;
  }, [weekData]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const handlePrev = () => {
    switch (view) {
      case 'week': setCurrentDate(subWeeks(currentDate, 1)); break;
      case 'two-weeks': setCurrentDate(subWeeks(currentDate, 2)); break;
      default: setCurrentDate(subMonths(currentDate, 1));
    }
  };
  const handleNext = () => {
    switch (view) {
      case 'week': setCurrentDate(addWeeks(currentDate, 1)); break;
      case 'two-weeks': setCurrentDate(addWeeks(currentDate, 2)); break;
      default: setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    if ((ticketsByDay[dateKey] || []).length > 0) {
      setSelectedDate(day);
      setModalOpen(true);
    }
  };

  const handleBlockDate = (day: Date) => addBlockedDate(format(day, 'yyyy-MM-dd'), 'Blocked by User');
  const handleUnblockDate = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    isSunday(day) ? addBlockedDate(key, 'Unblocked by User') : removeBlockedDate(key);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) =>
    e.dataTransfer.setData('ticketId', ticketId);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newDate: Date) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (!ticketId) return;
    const key = format(newDate, 'yyyy-MM-dd');
    const manualBlock = blockedDates.find((d) => d.id === key);
    const isBlocked = manualBlock ? manualBlock.reason !== 'Unblocked by User' : isSunday(newDate);
    if (isBlocked) {
      toast({ variant: 'destructive', title: 'Día Bloqueado', description: 'No puedes mover entregas a un día bloqueado.' });
      return;
    }
    updateTicket(ticketId, { deliveryDate: newDate as unknown as FieldValue });
    toast({ title: 'Tiquete Reprogramado', description: `La entrega se ha movido al ${format(newDate, 'PPP', { locale: es })}.` });
  };

  const selectedDayTickets = selectedDate
    ? ticketsByDay[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          {/* ── Header ── */}
          <div className="flex flex-col gap-4 mb-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg shrink-0">
                <Button
                  variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("h-8 px-3 text-xs gap-2", viewMode === 'calendar' && "bg-background shadow-sm")}
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarIcon className="h-4 w-4" />
                  Calendario
                </Button>
                <Button
                  variant={viewMode === 'agenda' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("h-8 px-3 text-xs gap-2", viewMode === 'agenda' && "bg-background shadow-sm")}
                  onClick={() => setViewMode('agenda')}
                >
                  <List className="h-4 w-4" />
                  Agenda
                </Button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="h-8 px-3 text-xs font-medium" onClick={() => setCurrentDate(new Date())}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {viewMode === 'calendar' && (
                <div className="grid grid-cols-3 bg-muted rounded-lg p-1 gap-1 flex-1">
                  {(['month', 'two-weeks', 'week'] as CalendarView[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        'rounded-md py-1.5 text-xs font-medium transition-all',
                        view === v
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {v === 'month' ? 'Mes' : v === 'two-weeks' ? '2 Semanas' : 'Semana'}
                    </button>
                  ))}
                </div>
              )}

              {/* Row 3: Filter selector (full width, only for non-installers) */}
              {!isInstallerOnly && (
                <div className={cn("grid grid-cols-3 bg-muted rounded-lg p-1 gap-1", viewMode === 'calendar' ? "flex-1" : "w-full")}>
                  {([
                    { key: 'deliveries', label: 'Entregas', icon: <Package className="h-3 w-3 text-cyan-600" /> },
                    { key: 'projects',   label: 'Proyectos', icon: <Wrench className="h-3 w-3 text-indigo-600" /> },
                    { key: 'all',        label: 'Ambos',     icon: null },
                  ] as { key: CalendarFilter; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={cn(
                        'rounded-md py-1.5 text-xs font-medium transition-all flex items-center justify-center gap-1',
                        filter === key
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center py-1">
              <h2 className="text-sm font-bold capitalize text-muted-foreground">{headerTitle}</h2>
            </div>
          </div>

          {viewMode === 'calendar' ? (
            <>
              {/* ── Weekday headers ── */}
              <div className="grid grid-cols-7 border-l border-t">
                {weekdays.map((d) => (
                  <div key={d} className="p-2 text-center font-medium text-sm text-muted-foreground border-b border-r">
                    {d}
                  </div>
                ))}
              </div>

              {/* ── Week rows ── */}
              <div className="border-l">
                {weekData.map(({ week, segments }, wi) => (
                  <WeekRow
                    key={wi}
                    week={week}
                    segments={segments}
                    showProjects={showProjects}
                    showTickets={showTickets}
                    ticketsByDay={ticketsByDay}
                    blockedDates={blockedDates}
                    maxDeliveries={maxDeliveries}
                    currentDate={currentDate}
                    users={users}
                    onDayClick={handleDayClick}
                    onBlockDate={handleBlockDate}
                    onUnblockDate={handleUnblockDate}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onProjectClick={(id) => router.push(`/projects/${id}`)}
                    maxSlot={globalMaxSlot}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="pt-2">
              <UnifiedAgenda 
                projects={projects} 
                ticketsByDay={ticketsByDay} 
                users={users} 
                filter={filter} 
              />
            </div>
          )}
        </div>
      </TooltipProvider>

      <DayDeliveriesModal
        isOpen={isModalOpen}
        onOpenChange={setModalOpen}
        date={selectedDate}
        tickets={selectedDayTickets}
      />
    </>
  );
}
