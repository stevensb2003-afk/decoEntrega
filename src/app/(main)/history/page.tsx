'use client';

import { DataTable } from '@/components/history/data-table';
import { columns } from '@/components/history/columns';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { Loader2, Ticket as TicketIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettingsContext } from '@/contexts/settings-context';

export default function HistoryPage() {
    const { tickets, users } = useAppContext();
    const { currentUser, isUserLoading, hasRole } = useAuth();
    const { isLoading: isSettingsLoading } = useSettingsContext();
    const router = useRouter();
    const [filteredRowCount, setFilteredRowCount] = useState(tickets.length);

     useEffect(() => {
        if (!isUserLoading && !isSettingsLoading && currentUser) {
            const canAccess = hasRole('admin') || hasRole('vendedor');
            if (!canAccess) {
                 router.replace('/dashboard');
            }
        }
    }, [currentUser, isUserLoading, isSettingsLoading, router, hasRole]);

    if (isUserLoading || isSettingsLoading || !currentUser) {
        return (
             <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // The useEffect will handle redirection if the role is not allowed.
    // Render nothing while waiting for redirection.
     if (!hasRole('admin') && !hasRole('vendedor')) {
        return null;
    }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Historial de Tiquetes</h1>
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-3 justify-center">
                    <TicketIcon className="h-8 w-8 text-primary" />
                    <span className="text-4xl font-bold">{filteredRowCount}</span>
                </div>
            </CardContent>
        </Card>
      </div>
      <DataTable columns={columns} data={tickets} onFilteredRowsChange={setFilteredRowCount} />
    </div>
  );
}
