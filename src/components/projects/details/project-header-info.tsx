'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project, ProjectStatus } from '@/lib/types';
import { ProjectStatusBadge } from '../status-badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROJECT_STATUS_STYLING } from '@/lib/project-styling-utils';
import { InlineEditField } from './inline-edit-field';
import {
  ALLOWED_MANUAL_TRANSITIONS,
  getTransitionResult,
  getConfirmationMessage,
} from '@/lib/project-status-utils';

interface ProjectHeaderInfoProps {
  project: Project;
  canEdit: boolean;
  canChangeStatus: boolean;
  onUpdate: (update: Partial<Project>) => void;
}

export function ProjectHeaderInfo({ project, canEdit, canChangeStatus, onUpdate }: ProjectHeaderInfoProps) {
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);

  const manualOptions = ALLOWED_MANUAL_TRANSITIONS[project.status] ?? [];

  const handleStatusChange = (newStatus: ProjectStatus) => {
    const result = getTransitionResult(project.status, newStatus);
    if (result === 'blocked') return;
    if (result === 'needs-confirmation') {
      setPendingStatus(newStatus);
      return;
    }
    applyStatusChange(newStatus);
  };

  const applyStatusChange = (newStatus: ProjectStatus) => {
    onUpdate({
      status: newStatus,
      ...(newStatus === 'Completado' ? { completedAt: new Date().toISOString() as any } : {}),
    });
    setPendingStatus(null);
  };

  const statusSelect = canChangeStatus && (
    <Select value={project.status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)}>
      <SelectTrigger className="h-8 w-auto text-xs shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={project.status} disabled>
          {project.status}
        </SelectItem>
        {manualOptions.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <div className={cn('border-b border-border bg-card/95 backdrop-blur-sm sticky top-16 z-30', PROJECT_STATUS_STYLING[project.status]?.border, 'border-l-4')}>
        <div className="container mx-auto px-4 py-3 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0 -ml-2">
              <Link href="/projects" aria-label="Volver">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-muted-foreground tracking-wider">
                  {project.projectId}
                </span>
                <ProjectStatusBadge status={project.status} />
              </div>
              <div className="mt-0.5">
                <InlineEditField
                  value={project.name}
                  onSave={(val) => onUpdate({ name: val })}
                  canEdit={canEdit}
                  className="hover:bg-transparent -ml-1 p-1"
                  inputClassName="text-base md:text-lg font-bold h-9"
                />
              </div>
            </div>

            {statusSelect}
          </div>
        </div>
      </div>

      {/* Modal de confirmación para transiciones con retroceso */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus ? getConfirmationMessage(project.status, pendingStatus) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingStatus && applyStatusChange(pendingStatus)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
