'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, ProjectStatus, ProjectStatuses, ProjectTask, ProjectMaterial, ProjectNote, User } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
import { ProjectStatusBadge } from './status-badge';
import { TaskList } from './task-list';
import { MaterialsList } from './materials-list';
import { NotesTimeline } from './notes-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, MapPin, ExternalLink, Phone, Copy, Calendar, User2,
  CheckSquare, Package, MessageSquare, Trash2, Navigation,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PROJECT_STATUS_STYLING } from '@/lib/project-styling-utils';

interface ProjectDetailProps {
  project: Project;
  users: User[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | any): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr?.seconds * 1000);
    return format(d, "d 'de' MMMM, yyyy", { locale: es });
  } catch { return '—'; }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ProjectDetail({ project, users }: ProjectDetailProps) {
  const { updateProject, deleteProject } = useAppContext();
  const { currentUser } = useAuth();
  const router = useRouter();

  const userRoles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const isAdmin = userRoles.includes('admin');
  const isVendedor = userRoles.includes('vendedor');
  const isCreator = currentUser?.id === project.ownerId;
  const canEdit = isAdmin || (isVendedor && isCreator);
  const canChangeStatus = isAdmin || isVendedor || userRoles.includes('instalador');

  const assignedInstallers = useMemo(
    () => users.filter((u) => project.installerIds?.includes(u.id)),
    [users, project.installerIds]
  );

  const creator = users.find((u) => u.id === project.ownerId);

  // ── Waze / Maps links ────────────────────────────────────────────────────
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.locationDetails || '')}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(project.locationDetails || '')}`;

  // ── Status change ────────────────────────────────────────────────────────
  const handleStatusChange = (newStatus: ProjectStatus) => {
    const update: Partial<Project> = { status: newStatus };
    if (newStatus === 'Completado') {
      update.completedAt = new Date().toISOString() as any;
    }
    updateProject(project.id, update);
  };

  // ── Task handlers ────────────────────────────────────────────────────────
  const handleToggleTask = (
    taskId: string, isCompleted: boolean,
    completedBy?: string, completedByName?: string, completedAt?: string
  ) => {
    const updatedTasks = project.tasks.map((t) =>
      t.id === taskId
        ? { ...t, isCompleted, ...(isCompleted ? { completedBy, completedByName, completedAt } : { completedBy: undefined, completedByName: undefined, completedAt: undefined }) }
        : t
    );
    updateProject(project.id, { tasks: updatedTasks });
  };

  const handleAddTask = (task: ProjectTask) => {
    updateProject(project.id, { tasks: [...(project.tasks ?? []), task] });
  };

  const handleRemoveTask = (taskId: string) => {
    updateProject(project.id, { tasks: project.tasks.filter((t) => t.id !== taskId) });
  };

  // ── Material handlers ────────────────────────────────────────────────────
  const handleAddMaterial = (material: ProjectMaterial) => {
    updateProject(project.id, { materials: [...(project.materials ?? []), material] });
  };

  const handleRemoveMaterial = (materialId: string) => {
    updateProject(project.id, { materials: project.materials.filter((m) => m.id !== materialId) });
  };

  // ── Note handler ─────────────────────────────────────────────────────────
  const handleAddNote = (note: ProjectNote) => {
    updateProject(project.id, { notes: [...(project.notes ?? []), note] });
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = () => {
    deleteProject(project.id);
    router.push('/projects');
  };

  // ── Date range display ───────────────────────────────────────────────────
  const dateDisplay = project.isOneDay
    ? formatDate(project.startDate)
    : `${formatDate(project.startDate)} → ${formatDate(project.endDate)}`;

  const taskCount = project.tasks?.length ?? 0;
  const completedTasks = project.tasks?.filter((t) => t.isCompleted).length ?? 0;
  const materialCount = project.materials?.length ?? 0;
  const noteCount = project.notes?.length ?? 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className={cn('border-b border-border bg-card sticky top-0 z-10', PROJECT_STATUS_STYLING[project.status]?.border, 'border-l-4')}>
        <div className="container mx-auto px-4 py-3 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0 -ml-2">
              <Link href="/projects" aria-label="Volver">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-muted-foreground tracking-wider">
                  {project.projectId}
                </span>
                <ProjectStatusBadge status={project.status} />
              </div>
              <h1 className="text-base md:text-lg font-bold tracking-tight truncate mt-0.5">
                {project.name}
              </h1>
            </div>

            {/* Status Selector */}
            {canChangeStatus && (
              <Select value={project.status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)}>
                <SelectTrigger className="h-8 w-auto text-xs shrink-0 hidden sm:flex">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ProjectStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8 flex-1">
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="main" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <User2 className="h-3.5 w-3.5 sm:hidden" />
              <span>Principal</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Tareas</span>
              {taskCount > 0 && (
                <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                  {completedTasks}/{taskCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Package className="h-3.5 w-3.5" />
              <span>Materiales</span>
              {materialCount > 0 && (
                <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                  {materialCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Principal ─────────────────────────────────────────────── */}
          <TabsContent value="main" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* Mobile status changer */}
            {canChangeStatus && (
              <div className="sm:hidden">
                <Select value={project.status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ProjectStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cliente */}
            <section className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cliente
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre</p>
                    <p className="font-medium text-sm">{project.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Contacto</p>
                    <p className="font-medium text-sm">{project.customerPhone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(project.customerPhone)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted"
                    aria-label="Copiar teléfono"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Ubicación */}
            <section className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ubicación
              </h3>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{project.locationDetails || 'Sin ubicación'}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors px-3 py-2 text-xs font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Google Maps
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors px-3 py-2 text-xs font-medium"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Waze
                </a>
              </div>
            </section>

            {/* Fechas y Asignación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <section className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Calendar className="inline h-3.5 w-3.5 mr-1" />
                  Fecha{!project.isOneDay ? 's' : ''}
                </h3>
                <p className="text-sm font-medium leading-relaxed">{dateDisplay}</p>
                {project.isOneDay && (
                  <span className="inline-block text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">1 solo día</span>
                )}
              </section>

              <section className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <User2 className="inline h-3.5 w-3.5 mr-1" />
                  Instaladores
                </h3>
                {assignedInstallers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin asignar</p>
                ) : (
                  <ul className="space-y-1">
                    {assignedInstallers.map((u) => (
                      <li key={u.id} className="text-sm font-medium">{u.name}</li>
                    ))}
                  </ul>
                )}
                {creator && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Creado por <span className="font-medium text-foreground">{creator.name}</span>
                  </p>
                )}
              </section>
            </div>

            {/* Description */}
            {project.description && (
              <section className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripción</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </section>
            )}

            {/* Notes */}
            <section className="rounded-xl border border-border bg-card p-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Notas {noteCount > 0 && <span className="text-muted-foreground">({noteCount})</span>}
              </h3>
              <NotesTimeline
                notes={project.notes ?? []}
                currentUserId={currentUser?.id ?? ''}
                currentUserName={currentUser?.name ?? 'Usuario'}
                onAddNote={handleAddNote}
              />
            </section>

            {/* Danger zone — delete */}
            {canEdit && (
              <div className="pt-4 border-t border-border">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar Proyecto
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar {project.projectId}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción es permanente. Se eliminará el proyecto <strong>{project.name}</strong> con todas sus tareas, materiales y notas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Tareas ────────────────────────────────────────────────── */}
          <TabsContent value="tasks" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TaskList
              tasks={project.tasks ?? []}
              canEdit={canChangeStatus}
              currentUserId={currentUser?.id ?? ''}
              currentUserName={currentUser?.name ?? 'Usuario'}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onRemoveTask={handleRemoveTask}
            />
          </TabsContent>

          {/* ── Tab: Materiales ───────────────────────────────────────────── */}
          <TabsContent value="materials" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MaterialsList
              materials={project.materials ?? []}
              canEdit={canChangeStatus}
              onAddMaterial={handleAddMaterial}
              onRemoveMaterial={handleRemoveMaterial}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
