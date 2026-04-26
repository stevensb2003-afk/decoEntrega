import { Project, ProjectPayment } from '@/lib/types';
import { DollarSign, Wallet, PiggyBank, Receipt } from 'lucide-react';
import { InlineEditField } from './inline-edit-field';
import { PaymentsList } from '../payments-list';
import { cn } from '@/lib/utils';

interface FinanceInfoSectionProps {
  project: Project;
  canEdit: boolean; // isAdmin || isVendedor
  isInstalador: boolean;
  onUpdate: (update: Partial<Project>) => void;
}

export function FinanceInfoSection({ project, canEdit, isInstalador, onUpdate }: FinanceInfoSectionProps) {
  const payments = project.payments || [];
  const extraCosts = project.extraCosts || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExtraCosts = extraCosts.reduce((sum, c) => sum + c.amount, 0);
  const saldoPendiente = (project.costoInst || 0) + totalExtraCosts - totalPaid;

  const handleAddPayment = (payment: ProjectPayment) => {
    onUpdate({ payments: [...payments, payment] });
  };

  const handleRemovePayment = (paymentId: string) => {
    onUpdate({ payments: payments.filter(p => p.id !== paymentId) });
  };

  return (
    <section className="space-y-6">
      <div className={cn(
        "grid gap-4",
        totalExtraCosts > 0 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" 
          : "grid-cols-1 sm:grid-cols-3"
      )}>
        {/* Card: Mano de Obra */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-1 dark:border-blue-900/30 dark:bg-blue-950/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Receipt className="h-3 w-3" /> Mano de Obra
          </p>
          <InlineEditField
            value={project.costoInst?.toString() || '0'}
            displayValue={(project.costoInst || 0).toLocaleString('es-CR')}
            onSave={(val) => onUpdate({ costoInst: parseFloat(val) || 0 })}
            canEdit={canEdit}
            type="number"
            prefix="₡"
            className="text-2xl font-bold text-blue-700 dark:text-blue-300"
          />
        </div>

        {/* Card: Costos Extras (Conditional) */}
        {totalExtraCosts > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 space-y-1 dark:border-amber-900/30 dark:bg-amber-950/20 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" /> Costos Extras
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              ₡{totalExtraCosts.toLocaleString('es-CR')}
            </p>
          </div>
        )}

        {/* Card: Total Adelantado */}
        <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-4 space-y-1 dark:border-orange-900/30 dark:bg-orange-950/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
            <PiggyBank className="h-3 w-3" /> Adelantado
          </p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            ₡{totalPaid.toLocaleString('es-CR')}
          </p>
        </div>

        {/* Card: Saldo Pendiente */}
        <div className={cn(
          "rounded-xl border p-4 space-y-1",
          saldoPendiente > 0 
            ? "border-green-100 bg-green-50/30 dark:border-green-900/30 dark:bg-green-950/20" 
            : "border-gray-100 bg-gray-50/30 dark:border-gray-800 dark:bg-gray-900/20"
        )}>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
            saldoPendiente > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}>
            <Wallet className="h-3 w-3" /> Saldo Pendiente
          </p>
          <p className={cn(
            "text-2xl font-bold",
            saldoPendiente > 0 ? "text-green-700 dark:text-green-300" : "text-muted-foreground"
          )}>
            ₡{saldoPendiente.toLocaleString('es-CR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <PaymentsList 
            payments={payments}
            canEdit={canEdit}
            onAddPayment={handleAddPayment}
            onRemovePayment={handleRemovePayment}
          />
        </div>
        
        {canEdit && (
          <div className="rounded-xl border border-border bg-card p-4 h-fit">
             <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Detalle de Costo Total</p>
             <div className="space-y-4">
                <div className="flex justify-between items-end border-b pb-2">
                  <span className="text-sm text-muted-foreground">Valor del Contrato:</span>
                  <InlineEditField
                    value={project.costoTotal?.toString() || '0'}
                    displayValue={(project.costoTotal || 0).toLocaleString('es-CR')}
                    onSave={(val) => onUpdate({ costoTotal: parseFloat(val) || 0 })}
                    canEdit={canEdit}
                    type="number"
                    prefix="₡"
                    className="font-bold text-lg"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  * Este monto corresponde al total cobrado al cliente final.
                </p>
             </div>
          </div>
        )}
      </div>
    </section>
  );
}
