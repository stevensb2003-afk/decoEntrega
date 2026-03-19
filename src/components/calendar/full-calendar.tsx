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
  getDay,
  addWeeks,
  subWeeks,
  addDays,
  isSunday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppContext } from '@/contexts/app-context';
import { Ticket } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DayDeliveriesModal } from './day-deliveries-modal';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Slash, AlertTriangle, MoreVertical, Phone, MapPin, Truck, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { FieldValue } from 'firebase/firestore';
import { useSettingsContext } from '@/contexts/settings-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type CalendarView = 'month' | 'two-weeks' | 'week';

export function FullCalendar() {
  const { ticketsByDay, blockedDates, addBlockedDate, removeBlockedDate, updateTicket, users } = useAppContext();
  const { config } = useSettingsContext();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [view, setView] = React.useState<CalendarView>('month');
  const { toast } = useToast();

  const maxDeliveries = config?.maxDeliveriesPerDay || 5;

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const ticketsForDay = ticketsByDay[dateKey] || [];
    
    if (ticketsForDay.length > 0) {
        setSelectedDate(day);
        setModalOpen(true);
    }
  };

  const handleBlockDate = (day: Date) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      addBlockedDate(dateKey, 'Blocked by User');
  };

  const handleUnblockDate = (day: Date) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      if (isSunday(day)) {
        // For Sundays, "unblocking" means adding a special entry.
        addBlockedDate(dateKey, 'Unblocked by User');
      } else {
        removeBlockedDate(dateKey);
      }
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // This is necessary to allow a drop.
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newDate: Date) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (!ticketId) return;

    const dateKey = format(newDate, 'yyyy-MM-dd');
    const manualBlock = blockedDates.find(d => d.id === dateKey);
    
    let isEffectivelyBlocked = false;
    if (manualBlock) {
      // It's blocked if it's manually blocked, unless it's a Sunday that has been explicitly unblocked
      isEffectivelyBlocked = manualBlock.reason !== 'Unblocked by User';
    } else if (isSunday(newDate)) {
      // Sundays are blocked by default if no manual entry exists for them
      isEffectivelyBlocked = true;
    }

    if (isEffectivelyBlocked) {
      toast({
        variant: 'destructive',
        title: 'Día Bloqueado',
        description: 'No puedes mover entregas a un día bloqueado.',
      });
      return;
    }

    updateTicket(ticketId, { deliveryDate: newDate as unknown as FieldValue });
    toast({
      title: 'Tiquete Reprogramado',
      description: `La entrega se ha movido al ${format(newDate, 'PPP', { locale: es })}.`
    })
  };

  const { days, headerTitle } = React.useMemo(() => {
    const weekStartsOn = 1; // Monday
    let interval: { start: Date, end: Date };
    let headerTitle = '';

    switch (view) {
      case 'week':
        const startOfThisWeek = startOfWeek(currentDate, { locale: es, weekStartsOn });
        interval = { start: startOfThisWeek, end: endOfWeek(currentDate, { locale: es, weekStartsOn }) };
        headerTitle = `${format(interval.start, 'd MMM', { locale: es })} - ${format(interval.end, 'd MMM, yyyy', { locale: es })}`;
        break;
      case 'two-weeks':
        const startOfTwoWeeks = startOfWeek(currentDate, { locale: es, weekStartsOn });
        interval = { start: startOfTwoWeeks, end: endOfWeek(addWeeks(currentDate, 1), { locale: es, weekStartsOn }) };
        headerTitle = `${format(interval.start, 'd MMM', { locale: es })} - ${format(interval.end, 'd MMM, yyyy', { locale: es })}`;
        break;
      case 'month':
      default:
        const monthStart = startOfMonth(currentDate);
        interval = { start: startOfWeek(monthStart, { locale: es, weekStartsOn }), end: endOfWeek(endOfMonth(monthStart), { locale: es, weekStartsOn }) };
        headerTitle = format(currentDate, 'MMMM yyyy', { locale: es });
        break;
    }
    
    return { days: eachDayOfInterval(interval), headerTitle };
  }, [currentDate, view]);


  const handlePrev = () => {
    switch (view) {
      case 'week': setCurrentDate(subWeeks(currentDate, 1)); break;
      case 'two-weeks': setCurrentDate(subWeeks(currentDate, 2)); break;
      case 'month': default: setCurrentDate(subMonths(currentDate, 1)); break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'week': setCurrentDate(addWeeks(currentDate, 1)); break;
      case 'two-weeks': setCurrentDate(addWeeks(currentDate, 2)); break;
      case 'month': default: setCurrentDate(addMonths(currentDate, 1)); break;
    }
  };


  const selectedDayTickets = selectedDate ? ticketsByDay[format(selectedDate, 'yyyy-MM-dd')] || [] : [];
  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h2 className="text-xl font-bold capitalize">
              {headerTitle}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button size="sm" variant={view === 'month' ? 'secondary' : 'ghost'} onClick={() => setView('month')}>Mes</Button>
                  <Button size="sm" variant={view === 'two-weeks' ? 'secondary' : 'ghost'} onClick={() => setView('two-weeks')}>2 Semanas</Button>
                  <Button size="sm" variant={view === 'week' ? 'secondary' : 'ghost'} onClick={() => setView('week')}>Semana</Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {weekdays.map((day) => (
              <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground border-b border-r border-t border-l">
                {day}
              </div>
            ))}

            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const ticketsForDay = ticketsByDay[dateKey] || [];
              const manualBlock = blockedDates.find(d => d.id === dateKey);

              let isEffectivelyBlocked = false;
              if (manualBlock) {
                isEffectivelyBlocked = manualBlock.reason !== 'Unblocked by User';
              } else if (isSunday(day)) {
                isEffectivelyBlocked = true;
              }

              const canBlockOrUnblock = ticketsForDay.length === 0;
              const isOverbooked = ticketsForDay.length > maxDeliveries;

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'p-2 border-b border-r flex flex-col relative group',
                    view === 'month' ? 'min-h-[8rem]' : 'min-h-[20rem]',
                    !isSameMonth(day, startOfMonth(currentDate)) && 'bg-muted/30 text-muted-foreground',
                    isOverbooked && !isEffectivelyBlocked && 'bg-destructive/10',
                  )}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                >
                    {isEffectivelyBlocked && (
                      <div className="absolute inset-0 bg-stone-400/20" style={{
                          backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 5px, hsl(var(--muted)) 5px, hsl(var(--muted)) 10px)',
                      }}>
                        { canBlockOrUnblock && <Slash className="absolute top-2 right-2 text-destructive/50" /> }
                      </div>
                    )}
                    <div className="flex justify-between items-start relative">
                          {isOverbooked && !isEffectivelyBlocked && (
                              <AlertTriangle className="text-destructive h-5 w-5" />
                          )}
                          <span
                              onClick={() => handleDayClick(day)}
                              className={cn(
                                  'font-semibold ml-auto',
                                  isSameDay(day, new Date()) && 'bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center',
                                  ticketsForDay.length > 0 && 'cursor-pointer'
                              )}
                          >
                              {format(day, 'd')}
                          </span>
                      </div>
                    <div className="flex-1 mt-1 space-y-1 relative" onDragOver={handleDragOver}>
                        {ticketsForDay.map(ticket => {
                          const isDelivered = ticket.status === 'Entregado';
                          const isCancelled = ticket.status === 'Cancelado';
                          const isDraggable = !isDelivered && !isCancelled;
                          const driver = users.find(u => u.id === ticket.driverId);
                          const owner = users.find(u => u.id === ticket.ownerId);

                          let bgColorClass = 'bg-primary/80 cursor-grab text-primary-foreground';
                          if (isDelivered) bgColorClass = 'bg-emerald-600 cursor-not-allowed text-white';
                          if (isCancelled) bgColorClass = 'bg-destructive cursor-not-allowed text-destructive-foreground';

                          return (
                            <Tooltip key={ticket.id}>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                      'text-xs rounded px-2 py-1 truncate',
                                      bgColorClass
                                  )}
                                  draggable={isDraggable}
                                  onDragStart={(e) => isDraggable && handleDragStart(e, ticket.id)}
                                  onDragOver={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()} 
                                >
                                {ticket.ticketId} - {ticket.customerName}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="w-64" side="top" align="center">
                                <div className="font-bold text-base mb-2">{ticket.ticketId} - {ticket.customerName}</div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{ticket.customerPhone}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <span className="flex-1">{ticket.locationdetails || 'No hay detalles de dirección'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-muted-foreground" />
                                    <span>Chofer: {driver?.name || 'No asignado'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                                    <span>Vendedor: {owner?.name || 'N/A'}</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                    </div>
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {canBlockOrUnblock && (
                              isEffectivelyBlocked ? (
                                <DropdownMenuItem onClick={() => handleUnblockDate(day)}>
                                  Desbloquear día
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleBlockDate(day)}>
                                  Bloquear día
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                </div>
              );
            })}
          </div>
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
