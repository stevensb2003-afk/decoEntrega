'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Ticket, TicketStatus, User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, fromUnixTime, isWithinInterval } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Trash2, Edit, Lock } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { ValidationModal } from '../dashboard/validation-modal';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
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
import { useState } from 'react';
import { TicketDetailsModal } from '../dashboard/ticket-details-modal';
import { cn } from '@/lib/utils';
import { TICKET_STATUS_STYLING } from '@/lib/styling-utils';


const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const styling = TICKET_STATUS_STYLING[status];
  return <Badge className={cn("font-semibold", styling.badge)}>{status}</Badge>;
};

const UserCell = ({ userId }: { userId: string }) => {
  const { users } = useAppContext();
  const user = users.find((u: User) => u.id === userId);
  return <span>{user?.name || 'Unknown'}</span>;
};

const DateCell = ({ date }: { date: any }) => {
  if (date instanceof Timestamp) {
    return format(fromUnixTime(date.seconds), 'PPp');
  }
  if (typeof date === 'string') {
     return format(new Date(date), 'PPp');
  }
  return <span>Invalid Date</span>;
};

const TicketIdCell = ({ ticket }: { ticket: Ticket }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <Button variant="link" className="p-0 h-auto" onClick={() => setIsModalOpen(true)}>
        {ticket.ticketId}
      </Button>
      <TicketDetailsModal ticket={ticket} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}


export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: 'ticketId',
    header: 'Ticket ID',
    cell: ({ row }) => <TicketIdCell ticket={row.original} />,
  },
  {
    accessorKey: 'customerName',
    header: 'Cliente',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Última actualización',
    cell: ({ row }) => <DateCell date={row.original.updatedAt} />,
    filterFn: (row, id, value) => {
      const date = row.original.updatedAt;
      const { from, to } = value as { from: Date, to: Date };
      if (!date || !from || !to) return false;

      let rowDate: Date;
      if (date instanceof Timestamp) {
          rowDate = date.toDate();
      } else if (typeof date === 'string') {
          rowDate = new Date(date);
      } else {
          return false;
      }
      return isWithinInterval(rowDate, { start: from, end: to });
    },
  },
  {
    accessorKey: 'ownerId',
    header: 'Vendedor',
    cell: ({ row }) => <UserCell userId={row.original.ownerId} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'driverId',
    header: 'Chofer',
    cell: ({ row }) => <UserCell userId={row.original.driverId} />,
  },
  {
    id: 'actions',
    enableSorting: false,
    cell: ({ row }) => {
      const ticket = row.original;
      const { deleteTicket, updateTicketStatus } = useAppContext();
      const { hasRole } = useAuth();
      const canDelete = hasRole('admin');
      
      const [isMenuOpen, setMenuOpen] = useState(false);
      const [isValidationModalOpen, setValidationModalOpen] = useState(false);
      const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
      const [isCancelAlertOpen, setCancelAlertOpen] = useState(false);
      const [deleteConfirm, setDeleteConfirm] = useState('');

      const handleSelect = (callback: () => void) => {
        return (e: Event) => {
            e.preventDefault();
            setMenuOpen(false);
            // Use a timeout to allow the dropdown to close before the modal opens
            setTimeout(callback, 100);
        }
      }

      return (
        <>
          <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onSelect={handleSelect(() => setValidationModalOpen(true))}>
                  <Edit className="mr-2 h-4 w-4" />
                  Validar / Ver
                </DropdownMenuItem>
                {ticket.status !== 'Cancelado' && ticket.status !== 'Entregado' && (
                  <DropdownMenuItem onSelect={handleSelect(() => setCancelAlertOpen(true))} className="text-orange-600 focus:bg-orange-100 focus:text-orange-700">
                      <Lock className="mr-2 h-4 w-4" />
                      Bloquear / Cancelar
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={handleSelect(() => setDeleteAlertOpen(true))} 
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Tiquete
                  </DropdownMenuItem>
                  </>
                )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ValidationModal ticket={ticket} open={isValidationModalOpen} onOpenChange={setValidationModalOpen} />
        
          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
              <AlertDialogContent>
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
                  <AlertDialogCancel onClick={() => setDeleteConfirm('')}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                      disabled={deleteConfirm !== 'ELIMINAR'}
                      onClick={() => deleteTicket(ticket.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >Eliminar Tiquete</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog open={isCancelAlertOpen} onOpenChange={setCancelAlertOpen}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Entrega</AlertDialogTitle>
                  <AlertDialogDescription>
                      ¿Está seguro que desea cambiar el estatus de este ticket a Cancelado?
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>Volver</AlertDialogCancel>
                  <AlertDialogAction onClick={() => updateTicketStatus(ticket.id, 'Cancelado')}>Sí, Cancelar</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </>
      );
    },
  },
];
