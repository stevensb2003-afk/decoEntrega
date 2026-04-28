import { Project, ProjectPayment } from '@/lib/types';
import { DollarSign, Wallet, PiggyBank, Receipt } from 'lucide-react';
import { InlineEditField } from './inline-edit-field';
import { PaymentsList } from '../payments-list';
import { cn } from '@/lib/utils';
import { shouldAutoComplete } from '@/lib/project-status-utils';
import { calcProjectFinancials } from '@/lib/project-finance-utils';

interface FinanceInfoSectionProps {
  project: Project;
  canEdit: boolean; // isAdmin || isVendedor
  isInstalador: boolean;
  onUpdate: (update: Partial<Project>) => void;
}

export function FinanceInfoSection({ project, canEdit, isInstalador, onUpdate }: FinanceInfoSectionProps) {
  const payments = project.payments || [];

  const {
    extrasTotal,
    extrasChargedToClient,
    extrasPaidByInstaller,
    extrasAbsorbed,
    instaladorTotal,
    instaladorAdelantado,
    instaladorPendiente,
    totalRevenue,
  } = calcProjectFinancials(project);

  const handleAddPayment = (payment: ProjectPayment) => {
    const newPayments = [...payments, payment];
    // Calcular el nuevo pendiente post-adelanto para evaluar auto-completado
    const newAdelantado = newPayments.reduce((s, p) => s + p.amount, 0);
    const newPendiente = Math.max(0, instaladorTotal - newAdelantado);

    const update: Partial<Project> = { payments: newPayments };

    if (shouldAutoComplete(project.status, newPendiente)) {
      update.status = 'Completado';
      update.completedAt = new Date().toISOString() as any;
    }

    onUpdate(update);
  };

  const handleRemovePayment = (paymentId: string) => {
    onUpdate({ payments: payments.filter(p => p.id !== paymentId) });
  };

  return (
    <section className="space-y-6">
      <div className={cn(
        "grid gap-4",
        extrasTotal > 0
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-3"
      )}>
        {/* Card: Pago a Instaladores (base editable) */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-1 dark:border-blue-900/30 dark:bg-blue-950/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Receipt className="h-3 w-3" /> Pago a Instaladores
          </p>
          <InlineEditField
            value={project.costoInst?.toString() || '0'}
            displayValue={instaladorTotal.toLocaleString('es-CR')}
            onSave={(val) => onUpdate({ costoInst: parseFloat(val) || 0 })}
            canEdit={canEdit}
            type="number"
            prefix="₡"
            className="text-2xl font-bold text-blue-700 dark:text-blue-300"
          />
          {extrasPaidByInstaller > 0 && (
            <p className="text-[10px] text-blue-500/70">
              Base: ₡{(project.costoInst || 0).toLocaleString('es-CR')} + Reembolsos: ₡{extrasPaidByInstaller.toLocaleString('es-CR')}
            </p>
          )}
        </div>

        {/* Card: Costos Extras — desglose por tipo (condicional) */}
        {extrasTotal > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 space-y-2 dark:border-amber-900/30 dark:bg-amber-950/20 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" /> Costos Extras
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              ₡{extrasTotal.toLocaleString('es-CR')}
            </p>
            <div className="flex flex-col gap-1 pt-1 border-t border-amber-200/50 dark:border-amber-800/50">
              {extrasChargedToClient > 0 && (
                <div className="flex justify-between items-center text-[10px] text-amber-700/80 dark:text-amber-300/80">
                  <span>Al cliente:</span>
                  <span className="font-semibold">₡{extrasChargedToClient.toLocaleString('es-CR')}</span>
                </div>
              )}
              {extrasPaidByInstaller > 0 && (
                <div className="flex justify-between items-center text-[10px] text-blue-600/80 dark:text-blue-400/80">
                  <span>Reembolso instalador:</span>
                  <span className="font-semibold">₡{extrasPaidByInstaller.toLocaleString('es-CR')}</span>
                </div>
              )}
              {extrasAbsorbed > 0 && (
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Absorbido empresa:</span>
                  <span className="font-semibold">₡{extrasAbsorbed.toLocaleString('es-CR')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card: Total Adelantado al Instalador */}
        <div className="rounded-xl border border-green-100 bg-green-50/30 p-4 space-y-1 dark:border-green-900/30 dark:bg-green-950/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <PiggyBank className="h-3 w-3" /> Adelantado
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            ₡{instaladorAdelantado.toLocaleString('es-CR')}
          </p>
        </div>

        {/* Card: Pendiente de Pagar al Instalador */}
        <div className={cn(
          "rounded-xl border p-4 space-y-1",
          instaladorPendiente > 0
            ? "border-red-100 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/20"
            : "border-gray-100 bg-gray-50/30 dark:border-gray-800 dark:bg-gray-900/20"
        )}>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
            instaladorPendiente > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
          )}>
            <Wallet className="h-3 w-3" /> Pendiente de Pagar
          </p>
          <p className={cn(
            "text-2xl font-bold",
            instaladorPendiente > 0 ? "text-red-700 dark:text-red-300" : "text-muted-foreground"
          )}>
            ₡{instaladorPendiente.toLocaleString('es-CR')}
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
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Detalle de Ingreso</p>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b pb-2">
                <span className="text-sm text-muted-foreground">Valor Base del Contrato:</span>
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
              {extrasChargedToClient > 0 && (
                <div className="flex justify-between items-center pb-2">
                  <span className="text-sm text-muted-foreground">Extras al cliente:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">₡{extrasChargedToClient.toLocaleString('es-CR')}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg border">
                <span className="text-sm font-semibold">Ingreso Total:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xl">₡{totalRevenue.toLocaleString('es-CR')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
