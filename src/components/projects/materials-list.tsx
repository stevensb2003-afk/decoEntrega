'use client';

import { useState } from 'react';
import { ProjectMaterial } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface MaterialsListProps {
  materials: ProjectMaterial[];
  canEdit: boolean;
  onAddMaterial: (material: ProjectMaterial) => void;
  onRemoveMaterial: (materialId: string) => void;
}

const emptyInput = { name: '', quantity: '1', unit: 'unidad' };

export function MaterialsList({ materials, canEdit, onAddMaterial, onRemoveMaterial }: MaterialsListProps) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState(emptyInput);

  const handleAdd = () => {
    const name = input.name.trim();
    const qty = parseFloat(input.quantity);
    if (!name || isNaN(qty) || qty <= 0) return;
    onAddMaterial({
      id: uuidv4(),
      name,
      quantity: qty,
      unit: input.unit.trim() || 'unidad',
      description: '',
      createdAt: new Date().toISOString(),
    });
    setInput(emptyInput);
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Table / List */}
      {materials.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
          <Package className="h-10 w-10 opacity-20" />
          <p className="text-sm">No hay materiales registrados</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_40px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
            <span>Material</span>
            <span className="text-center">Cantidad</span>
            <span>Unidad</span>
            <span />
          </div>

          {/* Rows */}
          <ul className="divide-y divide-border">
            {materials.map((m) => (
              <li key={m.id} className="group grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_40px] gap-1 sm:gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  {m.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:justify-center">
                  <span className="sm:hidden text-xs text-muted-foreground">Cantidad:</span>
                  <span className="text-sm font-semibold tabular-nums">{m.quantity}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="sm:hidden text-xs text-muted-foreground">Unidad:</span>
                  <span className="text-sm text-muted-foreground">{m.unit}</span>
                </div>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => onRemoveMaterial(m.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 justify-self-end sm:justify-self-auto"
                    aria-label={`Eliminar ${m.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : <span />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Inline Add Form */}
      {canEdit && adding && (
        <div className="rounded-lg border border-primary/40 bg-muted/30 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Material *</Label>
              <Input
                autoFocus
                value={input.name}
                onChange={(e) => setInput((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Porcelanato 60x60"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cantidad *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={input.quantity}
                onChange={(e) => setInput((p) => ({ ...p, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Unidad</Label>
              <Input
                value={input.unit}
                onChange={(e) => setInput((p) => ({ ...p, unit: e.target.value }))}
                placeholder="m², kg…"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1.5" /> Agregar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setInput(emptyInput); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Add Material Button */}
      {canEdit && !adding && (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Agregar Material
        </Button>
      )}
    </div>
  );
}
