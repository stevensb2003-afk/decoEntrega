import { ProjectStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Transiciones MANUALES permitidas por status actual
// 'Instalado → Completado' es AUTOMÁTICO (ver shouldAutoComplete), NO aparece aquí
// ---------------------------------------------------------------------------
export const ALLOWED_MANUAL_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  'Pendiente':   ['En Progreso', 'Cancelado'],
  'En Progreso': ['Instalado', 'Cancelado'],
  'Instalado':   ['En Progreso'],
  'Completado':  [],
  'Cancelado':   ['Pendiente'],
};

// ---------------------------------------------------------------------------
// Transiciones que requieren confirmación modal (retrocesos)
// ---------------------------------------------------------------------------
export const CONFIRMATION_REQUIRED: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
  'Instalado': ['En Progreso'],
  'Cancelado': ['Pendiente'],
};

// ---------------------------------------------------------------------------
// Mensajes contextuales para el modal de confirmación
// ---------------------------------------------------------------------------
export const CONFIRMATION_MESSAGES: Partial<Record<ProjectStatus, Partial<Record<ProjectStatus, string>>>> = {
  'Instalado': {
    'En Progreso': '¿Regresar el proyecto a "En Progreso"? Esto indica que hay correcciones pendientes en la instalación.',
  },
  'Cancelado': {
    'Pendiente': '¿Reactivar este proyecto como "Pendiente"? El proyecto volverá al flujo normal.',
  },
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export type TransitionResult = 'allowed' | 'blocked' | 'needs-confirmation';

// ---------------------------------------------------------------------------
// Evalúa si una transición es válida y si requiere confirmación
// ---------------------------------------------------------------------------
export function getTransitionResult(
  from: ProjectStatus,
  to: ProjectStatus
): TransitionResult {
  if (from === to) return 'blocked';
  const allowed = ALLOWED_MANUAL_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) return 'blocked';
  const needsConfirm = CONFIRMATION_REQUIRED[from]?.includes(to) ?? false;
  return needsConfirm ? 'needs-confirmation' : 'allowed';
}

// ---------------------------------------------------------------------------
// Retorna el mensaje de confirmación para una transición con retroceso
// ---------------------------------------------------------------------------
export function getConfirmationMessage(from: ProjectStatus, to: ProjectStatus): string {
  return (
    CONFIRMATION_MESSAGES[from]?.[to] ??
    `¿Cambiar el estado de "${from}" a "${to}"?`
  );
}

// ---------------------------------------------------------------------------
// Lógica de auto-completado: llamar en FinanceInfoSection al registrar un pago.
// Si el proyecto está en 'Instalado' y el saldo queda en 0 → marcar Completado
// ---------------------------------------------------------------------------
export function shouldAutoComplete(
  currentStatus: ProjectStatus,
  saldoPendiente: number
): boolean {
  return currentStatus === 'Instalado' && saldoPendiente <= 0;
}
