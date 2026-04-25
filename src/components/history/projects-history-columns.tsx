'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Project, ProjectStatus, User } from '@/lib/types';
import { ProjectStatusBadge } from '@/components/projects/status-badge';
import { format, fromUnixTime } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useAppContext } from '@/contexts/app-context';

const DateCell = ({ date }: { date: any }) => {
  if (!date) return <span className="text-muted-foreground">-</span>;
  if (date instanceof Timestamp) {
    return format(fromUnixTime(date.seconds), 'PPp');
  }
  if (typeof date === 'string') {
     return format(new Date(date), 'PPp');
  }
  return <span>Invalid Date</span>;
};

const InstallersCell = ({ installerIds }: { installerIds: string[] }) => {
  const { users } = useAppContext();
  
  if (!installerIds || installerIds.length === 0) return <span className="text-muted-foreground">Sin asignar</span>;

  const installerNames = installerIds.map(id => {
    const user = users.find((u: User) => u.id === id);
    return user?.name || 'Desconocido';
  });

  return <span>{installerNames.join(', ')}</span>;
};

export const projectColumns: ColumnDef<Project>[] = [
  {
    accessorKey: 'projectId',
    header: 'ID',
    cell: ({ row }) => <span className="font-semibold">{row.original.projectId}</span>,
  },
  {
    accessorKey: 'projectName',
    header: 'Proyecto',
  },
  {
    accessorKey: 'customerName',
    header: 'Cliente',
  },
  {
    accessorKey: 'installerIds',
    header: 'Instaladores',
    cell: ({ row }) => <InstallersCell installerIds={row.original.installerIds} />,
    filterFn: (row, id, value) => {
        // value is an array of selected installer IDs
        const rowInstallers = row.getValue(id) as string[];
        if (!rowInstallers || rowInstallers.length === 0) return false;
        return value.some((v: string) => rowInstallers.includes(v));
    },
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Inicio',
    cell: ({ row }) => <DateCell date={row.original.startDate} />,
  },
  {
    accessorKey: 'completedAt',
    header: 'Completado el',
    cell: ({ row }) => <DateCell date={row.original.completedAt} />,
  },
];
