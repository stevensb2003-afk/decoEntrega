import { Project } from '@/lib/types';

/**
 * Centralized financial calculations for a project.
 *
 * Financial model:
 *  - payments      → adelantos hechos AL INSTALADOR por la empresa
 *  - costoInst     → mano de obra base acordada con el instalador
 *  - extraCosts    → costos adicionales surgidos durante la instalación
 *
 * Two independent flags per ExtraCost:
 *  - chargedToClient   → suma al ingreso total (reportes)
 *  - paidByInstaller   → el instalador adelantó este dinero, empresa le debe reembolso
 *
 * Key outputs:
 *  - instaladorTotal    → lo que la empresa le debe al instalador en total
 *  - instaladorPendiente → lo que AÚN falta pagarle al instalador ("Pendiente de Pagar")
 *  - totalRevenue       → ingreso total del proyecto (costoTotal + extras facturables)
 */
export function calcProjectFinancials(project: Project) {
  const extras = project.extraCosts ?? [];
  const payments = project.payments ?? []; // adelantos al instalador

  // --- Desglose de Extras ---
  const extrasChargedToClient = extras
    .filter((e) => e.chargedToClient)
    .reduce((s, e) => s + e.amount, 0);

  const extrasPaidByInstaller = extras
    .filter((e) => e.paidByInstaller ?? false) // ?? false para retrocompatibilidad con datos viejos
    .reduce((s, e) => s + e.amount, 0);

  const extrasAbsorbed = extras
    .filter((e) => !e.chargedToClient && !(e.paidByInstaller ?? false))
    .reduce((s, e) => s + e.amount, 0);

  const extrasTotal = extras.reduce((s, e) => s + e.amount, 0);

  // --- Lado Instalador (lo que empresa le debe) ---
  const instaladorBase = project.costoInst ?? 0;
  const instaladorTotal = instaladorBase + extrasPaidByInstaller;
  const instaladorAdelantado = payments.reduce((s, p) => s + p.amount, 0);
  const instaladorPendiente = Math.max(0, instaladorTotal - instaladorAdelantado);

  // --- Ingreso Total (para reportes internos) ---
  const totalRevenue = (project.costoTotal ?? 0) + extrasChargedToClient;

  return {
    // Extras breakdown
    extrasTotal,
    extrasChargedToClient,
    extrasPaidByInstaller,
    extrasAbsorbed,

    // Installer-side
    instaladorBase,
    instaladorTotal,       // Total que empresa debe al instalador
    instaladorAdelantado,  // Ya adelantado al instalador
    instaladorPendiente,   // Pendiente de Pagar al instalador

    // Revenue
    totalRevenue,          // Ingreso total del proyecto
  };
}
