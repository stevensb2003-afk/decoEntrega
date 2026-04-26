'use client';

import { Project } from '@/lib/types';
import { Copy } from 'lucide-react';
import { InlineEditField } from './inline-edit-field';

interface CustomerInfoSectionProps {
  project: Project;
  canEdit: boolean;
  onUpdate: (update: Partial<Project>) => void;
}

export function CustomerInfoSection({ project, canEdit, onUpdate }: CustomerInfoSectionProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Cliente
      </h3>
      <div className="space-y-2">
        <InlineEditField
          label="Nombre"
          value={project.customerName}
          onSave={(val) => onUpdate({ customerName: val })}
          canEdit={canEdit}
        />
        
        <div className="flex items-center justify-between group/phone">
          <div className="flex-1">
            <InlineEditField
              label="Contacto"
              value={project.customerPhone}
              onSave={(val) => onUpdate({ customerPhone: val })}
              canEdit={canEdit}
              type="tel"
            />
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(project.customerPhone)}
            className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted self-end mb-1"
            aria-label="Copiar teléfono"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
