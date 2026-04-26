'use client';

import Link from 'next/link';
import { Project, ProjectStatus, ProjectStatuses } from '@/lib/types';
import { ProjectStatusBadge } from '../status-badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROJECT_STATUS_STYLING } from '@/lib/project-styling-utils';
import { InlineEditField } from './inline-edit-field';

interface ProjectHeaderInfoProps {
  project: Project;
  canEdit: boolean;
  canChangeStatus: boolean;
  isCompletionBlocked: boolean;
  saldoPendiente: number;
  onUpdate: (update: Partial<Project>) => void;
}

export function ProjectHeaderInfo({ project, canEdit, canChangeStatus, isCompletionBlocked, saldoPendiente, onUpdate }: ProjectHeaderInfoProps) {
  return (
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

          {canChangeStatus && (
            <Select 
              value={project.status} 
              onValueChange={(v) => onUpdate({ 
                status: v as ProjectStatus,
                ...(v === 'Completado' ? { completedAt: new Date().toISOString() as any } : {})
              })}
            >
              <SelectTrigger className="h-8 w-auto text-xs shrink-0 hidden sm:flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ProjectStatuses.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    disabled={s === 'Completado' && isCompletionBlocked}
                    className={s === 'Completado' && isCompletionBlocked ? 'opacity-40' : ''}
                  >
                    <span className="flex items-center gap-2">
                      {s === 'Completado' && isCompletionBlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      {s}
                      {s === 'Completado' && isCompletionBlocked && (
                        <span className="text-[10px] text-muted-foreground">
                          (Saldo: ₡{saldoPendiente.toLocaleString('es-CR')})
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
