'use client';

import { useState } from 'react';
import { ExtraCost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Plus, Trash2, ReceiptText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExtraCostsListProps {
  extraCosts: ExtraCost[];
  canEdit: boolean;
  onAddExtraCost: (cost: ExtraCost) => void;
  onRemoveExtraCost: (costId: string) => void;
  currentUserId: string;
}

const emptyInput = { description: '', amount: '' };

export function ExtraCostsList({ extraCosts, canEdit, onAddExtraCost, onRemoveExtraCost, currentUserId }: ExtraCostsListProps) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState(emptyInput);

  const handleAdd = () => {
    const desc = input.description.trim();
    const amt = parseFloat(input.amount);
    if (!desc || isNaN(amt) || amt <= 0) return;
    
    onAddExtraCost({
      id: uuidv4(),
      description: desc,
      amount: amt,
      createdAt: new Date().toISOString(),
      createdBy: currentUserId
    });
    setInput(emptyInput);
    setAdding(false);
  };

  const totalExtras = extraCosts.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <div className="space-y-4">
      {/* Total and Add Section */}
      <div className="flex flex-col gap-4">
        {/* Total Summary Card */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total de Costos Extras</p>
              <p className="text-xl font-bold text-foreground">₡{totalExtras.toLocaleString('es-CR')}</p>
            </div>
          </div>
          
          {canEdit && !adding && (
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-1.5" /> Registrar Costo
            </Button>
          )}
        </div>

        {/* Add new extra cost form */}
        {canEdit && adding && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground ml-1">Descripción</Label>
                <Input
                  placeholder="Ej: Silicona extra, tornillos, etc."
                  value={input.description}
                  onChange={(e) => setInput((p) => ({ ...p, description: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground ml-1">Monto (CRC)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">₡</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="pl-7 bg-background border-border"
                    value={input.amount}
                    onChange={(e) => setInput((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1.5" /> Agregar Gasto
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setInput(emptyInput); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* List Section */}
      {extraCosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2 bg-muted/20 rounded-xl border border-dashed border-border">
          <ReceiptText className="h-10 w-10 opacity-20" />
          <p className="text-sm">No hay costos extras registrados</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
          <div className="grid grid-cols-[1fr_120px_40px] gap-2 px-4 py-2.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b">
            <span>Descripción</span>
            <span className="text-right">Monto (CRC)</span>
            <span />
          </div>

          <ul className="divide-y divide-border/50">
            {extraCosts.map((c) => (
              <li key={c.id} className="group grid grid-cols-[1fr_120px_40px] gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                <p className="text-sm font-medium">{c.description}</p>
                <p className="text-sm font-semibold tabular-nums text-right text-foreground">
                  ₡{c.amount.toLocaleString('es-CR')}
                </p>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => onRemoveExtraCost(c.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-all opacity-0 group-hover:opacity-100 flex justify-center"
                    aria-label="Eliminar costo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : <span />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
