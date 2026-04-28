'use client';

import { useState } from 'react';
import { ExtraCost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Plus, Trash2, ReceiptText, Tag, HardHat } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

interface ExtraCostsListProps {
  extraCosts: ExtraCost[];
  canEdit: boolean;
  onAddExtraCost: (cost: ExtraCost) => void;
  onRemoveExtraCost: (costId: string) => void;
  currentUserId: string;
}

const emptyInput = {
  description: '',
  amount: '',
  chargedToClient: false,
  paidByInstaller: false,
};

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
      chargedToClient: input.chargedToClient,
      paidByInstaller: input.paidByInstaller,
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
    });
    setInput(emptyInput);
    setAdding(false);
  };

  const totalExtras = extraCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalChargedToClient = extraCosts.filter(c => c.chargedToClient).reduce((sum, c) => sum + c.amount, 0);
  const totalPaidByInstaller = extraCosts.filter(c => c.paidByInstaller ?? false).reduce((sum, c) => sum + c.amount, 0);
  const totalAbsorbed = extraCosts.filter(c => !c.chargedToClient && !(c.paidByInstaller ?? false)).reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
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

        {/* Desglose del total — solo si hay extras */}
        {extraCosts.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
            <div className="text-center">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Al Cliente</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">₡{totalChargedToClient.toLocaleString('es-CR')}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Reembolso</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">₡{totalPaidByInstaller.toLocaleString('es-CR')}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Empresa</p>
              <p className="text-sm font-bold text-muted-foreground">₡{totalAbsorbed.toLocaleString('es-CR')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Form: nuevo costo */}
      {canEdit && adding && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
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

          {/* Switches de clasificación */}
          <div className="space-y-3 pt-1 border-t border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clasificación del costo</p>

            {/* Switch 1: Cobrar al cliente */}
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              input.chargedToClient
                ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20"
                : "border-border bg-muted/20"
            )}>
              <Switch
                id="charge-to-client"
                checked={input.chargedToClient}
                onCheckedChange={(checked) => setInput(p => ({ ...p, chargedToClient: checked }))}
              />
              <div>
                <Label htmlFor="charge-to-client" className="text-sm font-medium cursor-pointer select-none">
                  Cobrar al cliente
                </Label>
                <p className="text-[10px] text-muted-foreground">Este monto se suma al ingreso total del proyecto</p>
              </div>
              {input.chargedToClient && <Tag className="h-4 w-4 text-amber-600 ml-auto shrink-0" />}
            </div>

            {/* Switch 2: El instalador adelantó */}
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              input.paidByInstaller
                ? "border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20"
                : "border-border bg-muted/20"
            )}>
              <Switch
                id="paid-by-installer"
                checked={input.paidByInstaller}
                onCheckedChange={(checked) => setInput(p => ({ ...p, paidByInstaller: checked }))}
              />
              <div>
                <Label htmlFor="paid-by-installer" className="text-sm font-medium cursor-pointer select-none">
                  El instalador adelantó este dinero
                </Label>
                <p className="text-[10px] text-muted-foreground">La empresa debe reembolsarle este monto al instalador</p>
              </div>
              {input.paidByInstaller && <HardHat className="h-4 w-4 text-blue-600 ml-auto shrink-0" />}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1.5" /> Agregar Gasto
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setInput(emptyInput); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de costos */}
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
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{c.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {c.chargedToClient && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100/70 dark:text-amber-400 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                        <Tag className="h-2.5 w-2.5" /> Al cliente
                      </span>
                    )}
                    {(c.paidByInstaller ?? false) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-100/70 dark:text-blue-400 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                        <HardHat className="h-2.5 w-2.5" /> Reembolso instalador
                      </span>
                    )}
                    {!c.chargedToClient && !(c.paidByInstaller ?? false) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                        Empresa absorbe
                      </span>
                    )}
                  </div>
                </div>
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
