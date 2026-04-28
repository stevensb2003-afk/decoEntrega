'use client';

import { useState } from 'react';
import { ProjectPayment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CreditCard, Calendar as CalendarIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface PaymentsListProps {
  payments: ProjectPayment[];
  canEdit: boolean;
  onAddPayment: (payment: ProjectPayment) => void;
  onRemovePayment: (paymentId: string) => void;
}

const emptyInput = { 
  amount: '', 
  date: new Date().toISOString().split('T')[0], 
  description: '',
  transferNumber: '',
};

export function PaymentsList({ payments, canEdit, onAddPayment, onRemovePayment }: PaymentsListProps) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState(emptyInput);

  const handleAdd = () => {
    const amt = parseFloat(input.amount);
    if (isNaN(amt) || amt <= 0) return;
    
    onAddPayment({
      id: uuidv4(),
      amount: amt,
      date: input.date,
      description: input.description.trim(),
      transferNumber: input.transferNumber.trim() || undefined,
      createdAt: new Date().toISOString()
    });
    setInput(emptyInput);
    setAdding(false);
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Historial de Adelantos / Pagos
        </h4>
        {canEdit && !adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)} className="h-7 text-[10px] uppercase tracking-wider">
            <Plus className="h-3 w-3 mr-1" /> Nuevo Adelanto
          </Button>
        )}
      </div>

      {payments.length === 0 && !adding ? (
        <div className="bg-muted/20 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">No se han registrado adelantos.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_auto_100px_40px] gap-2 px-4 py-2 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b">
            <span>Fecha</span>
            <span>Detalle</span>
            <span>N° Transf.</span>
            <span className="text-right">Monto</span>
            <span />
          </div>

          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="group grid grid-cols-[100px_1fr_auto_100px_40px] gap-2 px-4 py-2.5 items-center hover:bg-muted/30 transition-colors">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {p.date}
                </span>
                <span className="text-xs font-medium">
                  {p.description || 'Adelanto de mano de obra'}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {p.transferNumber ? `#${p.transferNumber}` : '—'}
                </span>
                <span className="text-xs font-bold tabular-nums text-right text-green-600">
                  ₡{p.amount.toLocaleString('es-CR')}
                </span>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => onRemovePayment(p.id)}
                    className="text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 text-right"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : <span />}
              </li>
            ))}
          </ul>
          
          <div className="bg-green-50/50 px-4 py-2 border-t flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase text-green-700">Total Adelantado</span>
            <span className="text-sm font-bold text-green-700">₡{totalPaid.toLocaleString('es-CR')}</span>
          </div>
        </div>
      )}

      {canEdit && adding && (
        <div className="rounded-lg border border-primary/20 bg-muted/30 p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-semibold text-muted-foreground">₡</span>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="pl-7 h-8 text-sm"
                  value={input.amount}
                  onChange={(e) => setInput((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Fecha</Label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={input.date}
                onChange={(e) => setInput((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] uppercase text-muted-foreground">Descripción (opcional)</Label>
              <Input
                placeholder="Ej: Pago inicial, viáticos, etc."
                className="h-8 text-sm"
                value={input.description}
                onChange={(e) => setInput((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] uppercase text-muted-foreground">N° de Transferencia (opcional)</Label>
              <Input
                placeholder="Ej: 123456789"
                className="h-8 text-sm font-mono"
                value={input.transferNumber}
                onChange={(e) => setInput((p) => ({ ...p, transferNumber: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="h-8 text-xs" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Registrar
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAdding(false); setInput(emptyInput); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
