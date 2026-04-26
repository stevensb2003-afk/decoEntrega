import { Project, ProjectMaterial } from '@/lib/types';
import { MaterialsList } from '../materials-list';
import { Package } from 'lucide-react';

interface MaterialsInfoSectionProps {
  project: Project;
  canEdit: boolean;
  onUpdate: (update: Partial<Project>) => void;
}

export function MaterialsInfoSection({ project, canEdit, onUpdate }: MaterialsInfoSectionProps) {
  const handleAddMaterial = (material: ProjectMaterial) => {
    onUpdate({ materials: [...(project.materials || []), material] });
  };

  const handleRemoveMaterial = (materialId: string) => {
    onUpdate({ materials: (project.materials || []).filter(m => m.id !== materialId) });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Package className="h-4 w-4" />
          Materiales a Instalar
        </h3>
      </div>
      
      <div className="pt-2">
        <MaterialsList 
          materials={project.materials || []}
          canEdit={canEdit}
          onAddMaterial={handleAddMaterial}
          onRemoveMaterial={handleRemoveMaterial}
        />
      </div>
    </section>
  );
}
