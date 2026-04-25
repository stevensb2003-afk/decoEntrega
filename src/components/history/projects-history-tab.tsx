'use client';

import { useState } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { DataTable } from '@/components/history/data-table';
import { projectColumns } from './projects-history-columns';
import { ProjectsMetrics } from './projects-metrics';
import { Card, CardContent } from '@/components/ui/card';
import { Hammer } from 'lucide-react';

export function ProjectsHistoryTab() {
  const { projects } = useAppContext();
  const [filteredRowCount, setFilteredRowCount] = useState(projects.length);

  // We can filter projects here if we want to show only certain ones, 
  // but usually history shows all, and data-table handles filtering.

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Historial de Instalaciones</h2>
        <Card className="bg-muted/40">
            <CardContent className="p-4 py-2">
                <div className="flex items-center gap-3 justify-center">
                    <Hammer className="h-6 w-6 text-primary" />
                    <span className="text-2xl font-bold">{filteredRowCount}</span>
                </div>
            </CardContent>
        </Card>
      </div>

      <ProjectsMetrics projects={projects} />

      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <DataTable 
            columns={projectColumns} 
            data={projects} 
            onFilteredRowsChange={setFilteredRowCount} 
            entityName="instalaciones"
            showMetrics={false}
            showStatusFilter={true}
            showOwnerFilter={true}
        />
      </div>
    </div>
  );
}
