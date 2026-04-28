'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Project, ProjectStatus, User } from '@/lib/types';
import { ProjectStatusBadge } from '@/components/projects/status-badge';
import { format, fromUnixTime } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
import { calcProjectFinancials } from '@/lib/project-finance-utils';
import Link from 'next/link';

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

const FinanceCell = ({ amount, isRestricted }: { amount?: number, isRestricted?: boolean }) => {
  const { currentUser } = useAuth();
  const isAdminOrSeller = currentUser?.role === 'admin' || currentUser?.role === 'vendedor';

  if (isRestricted && !isAdminOrSeller) {
    return <span className="text-muted-foreground">---</span>;
  }

  const value = amount || 0;
  return <span>₡{value.toLocaleString('es-CR')}</span>;
};

export const projectColumns: ColumnDef<Project>[] = [
  {
    accessorKey: 'projectId',
    header: 'ID',
    cell: ({ row }) => (
      <Link 
        href={`/projects/${row.original.id}`}
        className="font-semibold text-primary hover:underline whitespace-nowrap block"
      >
        {row.original.projectId}
      </Link>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Proyecto',
    cell: ({ row }) => (
      <Link 
        href={`/projects/${row.original.id}`}
        className="hover:underline text-primary font-medium"
      >
        {row.original.name}
      </Link>
    ),
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
    accessorKey: 'costoInst',
    header: 'Instalación',
    cell: ({ row }) => <FinanceCell amount={row.original.costoInst} />,
  },
  {
    id: 'adelantadoTotal',
    header: 'Adelanto',
    cell: ({ row }) => {
      const adelantado = row.original.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      return <FinanceCell amount={adelantado} />
    },
  },
  {
    id: 'ingresoTotal',
    header: 'Ingreso Total',
    cell: ({ row }) => {
      const { totalRevenue } = calcProjectFinancials(row.original);
      return <FinanceCell amount={totalRevenue} isRestricted={true} />
    },
  },
  {
    id: 'pendientePagar',
    header: 'Pendiente Pagar',
    cell: ({ row }) => {
      const { instaladorPendiente } = calcProjectFinancials(row.original);
      return <FinanceCell amount={Math.max(0, instaladorPendiente)} isRestricted={true} />
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
