import { TicketStatus } from '@/lib/types';

type StatusStyling = {
  badge: string;
  border: string;
};

export const TICKET_STATUS_STYLING: Record<TicketStatus, StatusStyling> = {
  'Pendiente': {
    // Azul cielo en lugar de slate para que no parezca gris
    badge: 'bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200 border',
    border: 'border-sky-400',
  },
  'Alistando': {
    badge: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 border',
    border: 'border-amber-500',
  },
  'En Ruta': {
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200 border',
    border: 'border-indigo-500',
  },
  'Entregado': {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 border',
    border: 'border-emerald-500',
  },
  'Cancelado': {
    badge: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 border',
    border: 'border-red-500',
  },
};