

'use client';

import { useState, useRef, useMemo } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { Ticket, TicketStatus, TicketStatuses, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '../ui/button';
import { MapPin, Phone, Trash2, CheckCircle, Hash, User as UserIcon, ChevronDown, Lock, Truck } from 'lucide-react';
import { differenceInBusinessDays, isToday, isPast, startOfDay, startOfWeek } from 'date-fns';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { TicketDetailsModal } from './ticket-details-modal';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { TICKET_STATUS_STYLING } from '@/lib/styling-utils';

const StatusChanger = ({ ticket, onStatusChange }: { ticket: Ticket; onStatusChange: (ticketId: string, newStatus: TicketStatus) => void; }) => {
    const isDelivered = ticket.status === 'Entregado';
    const styling = TICKET_STATUS_STYLING[ticket.status];

    if (isDelivered) {
        return (
             <Badge
                variant="outline"
                className={cn("font-semibold", styling.badge)}
            >
                <Lock className="mr-1 h-3 w-3" />
                {ticket.status}
            </Badge>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Badge
                    variant="outline"
                    className={cn(
                        "cursor-pointer transition-colors font-semibold",
                        styling.badge
                    )}
                >
                    {ticket.status}
                    <ChevronDown className="ml-1 h-3 w-3" />
                </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Cambiar Estatus</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={ticket.status} onValueChange={(newStatus) => onStatusChange(ticket.id, newStatus as TicketStatus)}>
                    {TicketStatuses.filter(s => s !== 'Cancelado').map(status => (
                        <DropdownMenuRadioItem key={status} value={status} disabled={status === 'Entregado'}>
                            {status}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const PriorityChanger = ({ ticket, ticketsInColumn, onPositionChange }: { ticket: Ticket; ticketsInColumn: Ticket[]; onPositionChange: (ticketId: string, newPosition: number) => void; }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (ticket.status !== 'En Ruta') {
        return null;
    }

    const sortedTickets = [...ticketsInColumn].sort((a, b) => a.priority - b.priority);
    const currentPosition = sortedTickets.findIndex(t => t.id === ticket.id) + 1;
    const totalPositions = sortedTickets.length;

    if (currentPosition === 0) return null;

    const handleValueChange = (newPos: string) => {
        onPositionChange(ticket.id, parseInt(newPos, 10));
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent">
                    <span className="font-bold text-foreground">{currentPosition}</span>
                    <span className='mx-0.5'>/</span>
                    <span>{totalPositions}</span>
                    <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Cambiar Posición</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={String(currentPosition)}
                    onValueChange={handleValueChange}
                >
                    {Array.from({ length: totalPositions }, (_, i) => i + 1).map(pos => (
                        <DropdownMenuRadioItem key={pos} value={String(pos)}>
                            Mover a posición {pos}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const DriverChanger = ({ ticket }: { ticket: Ticket }) => {
    const { users, updateTicket } = useAppContext();
    const drivers = useMemo(() => users.filter(u => {
        const r = u.roles || (u.role ? [u.role] : []);
        return r.includes('chofer');
    }), [users]);
    const currentDriver = useMemo(() => users.find(u => u.id === ticket.driverId), [users, ticket.driverId]);

    const handleDriverChange = (newDriverId: string) => {
        const newDriverValue = newDriverId === '' ? '' : newDriverId;
        if (ticket.driverId !== newDriverValue) {
            updateTicket(ticket.id, { driverId: newDriverValue });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="p-0 h-auto font-normal justify-start w-full text-sm hover:bg-transparent -mx-0.5">
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="font-medium flex-1 truncate text-left text-foreground">
                            {currentDriver?.name || 'No asignado'}
                        </span>
                        <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuLabel>Asignar Chofer</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {drivers.length > 0 ? (
                    <DropdownMenuRadioGroup value={ticket.driverId || ''} onValueChange={handleDriverChange}>
                        {drivers.map(driver => (
                            <DropdownMenuRadioItem key={driver.id} value={driver.id}>
                                {driver.name}
                            </DropdownMenuRadioItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioItem value="">
                            <span className='italic'>No asignado</span>
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                ) : (
                    <DropdownMenuItem disabled>No hay choferes disponibles</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


const KanbanCard = ({ ticket, ticketsInColumn, onDragOverCard, onStatusChange, onPositionChange }: { ticket: Ticket; ticketsInColumn: Ticket[]; onDragOverCard: (e: React.DragEvent<HTMLDivElement>, ticketId: string) => void; onStatusChange: (ticketId: string, newStatus: TicketStatus) => void; onPositionChange: (ticketId: string, newPosition: number) => void; }) => {
  const { deleteTicket, users } = useAppContext();
  const { hasRole } = useAuth();
  const canDelete = hasRole('admin');
  const owner = users.find(u => u.id === ticket.ownerId);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const isDelivered = ticket.status === 'Entregado';
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticket: Ticket) => {
    if (isDelivered) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('ticketId', ticket.id);
  };
  
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button') && !target.closest('a') && !target.closest('[role="menu"]')) {
        setDetailsModalOpen(true);
    }
  }

  return (
    <>
    <Card
      draggable={!isDelivered}
      onDragStart={(e) => handleDragStart(e, ticket)}
      onClick={handleCardClick}
      onDragOver={(e) => onDragOverCard(e, ticket.id)}
      className={cn(
          "mb-4 transition-shadow hover:shadow-lg",
          isDelivered ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      )}
    >
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold truncate pr-2">{ticket.ticketId} - {ticket.customerName}</CardTitle>
        <div className='flex items-center gap-1 shrink-0'>
            {(hasRole('admin') || hasRole('vendedor')) && !isDelivered && (
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                    onClick={(e) => { e.stopPropagation(); onStatusChange(ticket.id, 'Cancelado'); }}
                 >
                    <Lock className="h-4 w-4" />
                 </Button>
            )}
            {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el tiquete <span className='font-bold'>{ticket.ticketId}</span>.
                            <br/><br/>
                            Escribe <strong>ELIMINAR</strong> para confirmar el borrado.
                            <Input
                                value={deleteConfirm}
                                onChange={(e) => setDeleteConfirm(e.target.value)}
                                className="mt-2"
                                placeholder="ELIMINAR"
                            />
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteConfirm(''); }}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            disabled={deleteConfirm !== 'ELIMINAR'}
                            onClick={() => deleteTicket(ticket.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >Eliminar Tiquete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-3">
        {ticket.ordernumber && (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span>{ticket.ordernumber}</span>
            </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span>{ticket.customerPhone}</span>
        </div>
        <a href={ticket.addressLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
          <MapPin className="w-4 h-4" />
          <span>Ver ubicación</span>
        </a>
        {owner && (
            <div className="flex items-center gap-2 text-muted-foreground">
                <UserIcon className="h-4 w-4"/>
                <span className="font-medium flex-1 truncate">{owner.name}</span>
            </div>
        )}
        <DriverChanger ticket={ticket} />
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 w-full">
            <PriorityChanger ticket={ticket} ticketsInColumn={ticketsInColumn} onPositionChange={onPositionChange} />
            <div className="flex-1" />
            {ticket.satisfaction && (
                <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4"/>
                    <span>Validado</span>
                </div>
            )}
            <StatusChanger ticket={ticket} onStatusChange={onStatusChange} />
        </div>
      </CardFooter>
    </Card>
    <TicketDetailsModal ticket={ticket} isOpen={isDetailsModalOpen} onOpenChange={setDetailsModalOpen} />
    </>
  );
};

const KanbanColumn = ({ status, tickets, handleDrop, handleDragOver, handleDragOverCard, handleStatusChange, handlePositionChange }: { status: TicketStatus; tickets: Ticket[]; handleDrop: (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => void; handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void; handleDragOverCard: (e: React.DragEvent<HTMLDivElement>, ticketId: string) => void; handleStatusChange: (ticketId: string, newStatus: TicketStatus) => void; handlePositionChange: (ticketId: string, newPosition: number) => void; }) => {
  const [isOver, setIsOver] = useState(false);
  const sortedTickets = tickets.sort((a,b) => a.priority - b.priority);
  const styling = TICKET_STATUS_STYLING[status];

  return (
    <div
      onDrop={(e) => { handleDrop(e, status); setIsOver(false); }}
      onDragOver={handleDragOver}
      onDragEnter={() => setIsOver(true)}
      onDragLeave={() => setIsOver(false)}
      className={`flex-1 min-w-[300px] rounded-lg transition-colors ${isOver ? 'bg-primary/10' : ''}`}
    >
      <div className="p-4">
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-t-lg border-b-4 bg-background",
          styling.border
        )}>
          <h2 className="font-semibold text-lg text-foreground/80">{status}</h2>
          <span className="text-sm font-bold bg-muted-foreground/20 text-muted-foreground rounded-full px-2 py-0.5">
            {tickets.length}
          </span>
        </div>
        <div className="p-2 h-[calc(100vh-250px)] overflow-y-auto">
          {sortedTickets.map((ticket) => (
            <KanbanCard key={ticket.id} ticket={ticket} ticketsInColumn={sortedTickets} onDragOverCard={handleDragOverCard} onStatusChange={handleStatusChange} onPositionChange={handlePositionChange} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const KanbanBoard = ({ selectedSellerIds }: { selectedSellerIds: string[] }) => {
  const { tickets, updateTicketStatus, getTicketById, updateTicketPriority, moveTicketToPosition } = useAppContext();
  const { toast } = useToast();
  const dragOverTicketId = useRef<string | null>(null);
  const [cancelTicketId, setCancelTicketId] = useState<string | null>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragOverCard = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
    e.preventDefault();
    dragOverTicketId.current = ticketId;
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
      const ticket = getTicketById(ticketId);
      if (!ticket) return;
      
      if(ticket.status === 'Entregado') return;

      if (newStatus === 'Entregado' && !ticket.satisfaction) {
          toast({
              variant: 'destructive',
              title: 'Validación Requerida',
              description: 'Debes completar la validación de entrega antes de marcar como "Entregado".',
          });
          return;
      }
      if (newStatus === 'Cancelado') {
          setCancelTicketId(ticketId);
          return;
      }
      
      updateTicketStatus(ticketId, newStatus);
  };

  const confirmCancel = () => {
      if (cancelTicketId) {
          updateTicketStatus(cancelTicketId, 'Cancelado');
          setCancelTicketId(null);
      }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TicketStatus) => {
    const ticketId = e.dataTransfer.getData('ticketId');
    const ticket = getTicketById(ticketId);

    if (!ticket || ticket.status === 'Entregado') return;

    if (ticket.status === newStatus && dragOverTicketId.current && dragOverTicketId.current !== ticket.id) {
        const targetTicket = getTicketById(dragOverTicketId.current);
        if (targetTicket) {
            const columnTickets = tickets.filter(t => t.status === newStatus).sort((a,b) => a.priority - b.priority);
            const targetIndex = columnTickets.findIndex(t => t.id === targetTicket.id);
            const prevTicket = columnTickets[targetIndex - 1];
            const newPriority = prevTicket ? (targetTicket.priority + prevTicket.priority) / 2 : targetTicket.priority - 1;
            updateTicketPriority(ticketId, newPriority);
        }
    } else if (ticket.status !== newStatus) {
        handleStatusChange(ticketId, newStatus);
    }
    
    dragOverTicketId.current = null;
  };
  
  const filteredTickets = useMemo(() => {
    // Costa Rica is UTC-6
    const now = new Date();
    // To get the "Sunday 00:00 AM" in CR time, we subtract 6 hours from current time, 
    // find the start of the week, and that gives us the Sunday 00:00 in "CR space".
    const crTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    const startOfCrWeek = startOfWeek(crTime, { weekStartsOn: 0 }); // Sunday 00:00 CR
    
    // We convert it back to a real UTC timestamp for comparison
    const cutoffTimestamp = startOfCrWeek.getTime() + (6 * 60 * 60 * 1000);

    const baseTickets = tickets.filter(ticket => {
        // Special case for Delivered and Cancelled: they should clear every Sunday at 00:00 CR
        if (ticket.status === 'Entregado' || ticket.status === 'Cancelado') {
            let updatedDate: Date;
            if (ticket.updatedAt instanceof Timestamp) {
                updatedDate = ticket.updatedAt.toDate();
            } else if (typeof ticket.updatedAt === 'string') {
                updatedDate = new Date(ticket.updatedAt);
            } else {
                return true;
            }
            // Hide if it was updated before the most recent Sunday 00:00 CR
            return updatedDate.getTime() >= cutoffTimestamp;
        }

        if (!ticket.deliveryDate) {
            return true;
        }

        let deliveryDate: Date;
        if (ticket.deliveryDate instanceof Timestamp) {
            deliveryDate = ticket.deliveryDate.toDate();
        } else if (typeof ticket.deliveryDate === 'string') {
            deliveryDate = new Date(ticket.deliveryDate);
        } else {
            return true;
        }

        return isToday(deliveryDate) || isPast(startOfDay(deliveryDate));
    });

    if (selectedSellerIds.length === 0) {
        return baseTickets;
    }

    return baseTickets.filter(ticket => 
        selectedSellerIds.includes(ticket.ownerId) || 
        (ticket.driverId && selectedSellerIds.includes(ticket.driverId))
    );
  }, [tickets, selectedSellerIds]);

  return (
    <>
    <ScrollArea className="w-full">
      <div className="flex gap-6 pb-4">
        {TicketStatuses.filter(s => s !== 'Cancelado').map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={filteredTickets.filter((t) => t.status === status)}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleDragOverCard={handleDragOverCard}
            handleStatusChange={handleStatusChange}
            handlePositionChange={moveTicketToPosition}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
    
    <AlertDialog open={!!cancelTicketId} onOpenChange={(open) => !open && setCancelTicketId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Entrega</AlertDialogTitle>
            <AlertDialogDescription>
                ¿Está seguro que desea cambiar el estatus de este ticket a Cancelado?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Sí, Cancelar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
    
