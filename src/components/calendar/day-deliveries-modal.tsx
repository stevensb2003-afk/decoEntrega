'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Ticket, User } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { useAppContext } from '@/contexts/app-context';
import { User as UserIcon } from 'lucide-react';
import { TICKET_STATUS_STYLING } from '@/lib/styling-utils';
import { cn } from '@/lib/utils';

interface DayDeliveriesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  tickets: Ticket[];
}

export function DayDeliveriesModal({
  isOpen,
  onOpenChange,
  date,
  tickets,
}: DayDeliveriesModalProps) {
  const { users } = useAppContext();
  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Entregas para el {format(date, 'PPP', { locale: es })}
          </DialogTitle>
          <DialogDescription>
            Se encontraron {tickets.length} entregas para esta fecha.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {tickets.length > 0 ? (
            tickets.map((ticket) => {
              const owner = users.find((u: User) => u.id === ticket.ownerId);
              return (
                <div key={ticket.id} className="p-3 rounded-md border bg-muted/50">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="font-bold">{ticket.ticketId} - {ticket.customerName}</p>
                          <p className="text-sm text-muted-foreground break-words">{ticket.locationdetails || ticket.addressLink}</p>
                          {owner && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                                <UserIcon className="h-3 w-3"/>
                                <span>{owner.name}</span>
                            </div>
                          )}
                      </div>
                      <div className='text-right flex-shrink-0 ml-4'>
                        <Badge variant="outline" className={cn("mb-1", TICKET_STATUS_STYLING[ticket.status]?.badge || 'bg-secondary')}>{ticket.status}</Badge>
                      </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay entregas programadas para este día.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
