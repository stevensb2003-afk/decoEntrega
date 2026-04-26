'use client';

import { Project } from '@/lib/types';
import { InlineEditField } from './inline-edit-field';

interface DescriptionSectionProps {
  project: Project;
  canEdit: boolean;
  onUpdate: (update: Partial<Project>) => void;
}

export function DescriptionSection({ project, canEdit, onUpdate }: DescriptionSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripción</h3>
      <div className="flex-1">
        <InlineEditField
          value={project.description || ''}
          onSave={(val) => onUpdate({ description: val })}
          canEdit={canEdit}
          type="textarea"
          inputClassName="min-h-[100px] text-sm leading-relaxed whitespace-pre-wrap"
        />
      </div>
    </section>
  );
}
