import { ProjectStatus } from '@/lib/types';

type StatusStyling = {
  badge: string;
  border: string;
};

export const PROJECT_STATUS_STYLING: Record<ProjectStatus, StatusStyling> = {
  'Pendiente': {
    badge: 'bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200 border',
    border: 'border-sky-400',
  },
  'En Progreso': {
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200 border',
    border: 'border-indigo-500',
  },
  'Completado': {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 border',
    border: 'border-emerald-500',
  },
  'Cancelado': {
    badge: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 border',
    border: 'border-red-500',
  },
};
