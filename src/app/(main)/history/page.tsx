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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectsHistoryTab } from '@/components/history/projects-history-tab';

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
                 router.replace('/projects');
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
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Historial</h1>
      
      <Tabs defaultValue="entregas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger value="entregas" className="text-lg">Entregas</TabsTrigger>
          <TabsTrigger value="instalaciones" className="text-lg">Instalaciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entregas" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Historial de Entregas</h2>
            <Card className="bg-muted/40">
                <CardContent className="p-4 py-2">
                    <div className="flex items-center gap-3 justify-center">
                        <TicketIcon className="h-6 w-6 text-primary" />
                        <span className="text-2xl font-bold">{filteredRowCount}</span>
                    </div>
                </CardContent>
            </Card>
          </div>
          <DataTable columns={columns} data={tickets} onFilteredRowsChange={setFilteredRowCount} />
        </TabsContent>
        
        <TabsContent value="instalaciones">
           <ProjectsHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
