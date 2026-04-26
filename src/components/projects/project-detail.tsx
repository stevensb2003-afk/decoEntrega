'use client';

import { useRouter } from 'next/navigation';
import { Project, ProjectStatus, ProjectTask, ProjectMaterial, ProjectNote, User } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { useAuth } from '@/hooks/use-auth';
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
  User2, CheckSquare, Package, MessageSquare, Trash2, Lock
} from 'lucide-react';
import { ProjectHeaderInfo } from './details/project-header-info';
import { CustomerInfoSection } from './details/customer-info-section';
import { LocationInfoSection } from './details/location-info-section';
import { ScheduleInfoSection } from './details/schedule-info-section';
import { FinanceInfoSection } from './details/finance-info-section';
import { DescriptionSection } from './details/description-section';
import { MaterialsInfoSection } from './details/materials-info-section';
import { ExtraCostsList } from './extra-costs-list';

interface ProjectDetailProps {
  project: Project;
  users: User[];
}

export function ProjectDetail({ project, users }: ProjectDetailProps) {
  const { updateProject, deleteProject } = useAppContext();
  const { currentUser } = useAuth();
  const router = useRouter();

  const userRoles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const isAdmin = userRoles.includes('admin');
  const isVendedor = userRoles.includes('vendedor');
  const isInstalador = userRoles.includes('instalador');
  const isCreator = currentUser?.id === project.ownerId;
  const canEdit = isAdmin || (isVendedor && isCreator);
  const canChangeStatus = isAdmin || isVendedor || isInstalador;
  const canEditMaterials = isAdmin || isVendedor;

  const handleUpdate = (update: Partial<Project>) => {
    updateProject(project.id, update);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    router.push('/projects');
  };

  const taskCount = project.tasks?.length ?? 0;
  const completedTasks = project.tasks?.filter((t) => t.isCompleted).length ?? 0;
  const extraCostsCount = project.extraCosts?.length ?? 0;
  const noteCount = project.notes?.length ?? 0;

  // Bloqueo de "Completado" si hay saldo pendiente al instalador
  const totalPaid = (project.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const totalExtraCosts = (project.extraCosts ?? []).reduce((s, c) => s + c.amount, 0);
  const saldoPendiente = (project.costoInst ?? 0) + totalExtraCosts - totalPaid;
  const isCompletionBlocked = saldoPendiente > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <ProjectHeaderInfo 
        project={project}
        canEdit={canEdit}
        canChangeStatus={canChangeStatus}
        isCompletionBlocked={isCompletionBlocked}
        saldoPendiente={saldoPendiente}
        onUpdate={handleUpdate}
      />

      <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8 flex-1">
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
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
            <TabsTrigger value="extra-costs" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Package className="h-3.5 w-3.5" />
              <span>Costos Extras</span>
              {extraCostsCount > 0 && (
                <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                  {extraCostsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Notas</span>
              {noteCount > 0 && (
                <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                  {noteCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Mobile status changer */}
            {canChangeStatus && (
              <div className="sm:hidden">
                <Select value={project.status} onValueChange={(v) => handleUpdate({ status: v as any })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Pendiente', 'En Progreso', 'Completado', 'Cancelado'].map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        disabled={s === 'Completado' && isCompletionBlocked}
                        className={s === 'Completado' && isCompletionBlocked ? 'opacity-40' : ''}
                      >
                        <span className="flex items-center gap-2">
                          {s === 'Completado' && isCompletionBlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                          {s}
                          {s === 'Completado' && isCompletionBlocked && (
                            <span className="text-[10px] text-muted-foreground">
                              (Saldo: ₡{saldoPendiente.toLocaleString('es-CR')})
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <CustomerInfoSection project={project} canEdit={canEdit} onUpdate={handleUpdate} />
            <DescriptionSection project={project} canEdit={canEdit} onUpdate={handleUpdate} />
            <LocationInfoSection project={project} canEdit={canEdit} onUpdate={handleUpdate} />
            <ScheduleInfoSection project={project} users={users} canEdit={canEdit} onUpdate={handleUpdate} />
            
            <MaterialsInfoSection project={project} canEdit={canEditMaterials} onUpdate={handleUpdate} />

            {(isAdmin || isVendedor || isInstalador) && (
              <FinanceInfoSection 
                project={project} 
                canEdit={isAdmin || isVendedor} 
                isInstalador={isInstalador} 
                onUpdate={handleUpdate} 
              />
            )}

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

          <TabsContent value="tasks" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TaskList
              tasks={project.tasks ?? []}
              canEdit={canChangeStatus}
              currentUserId={currentUser?.id ?? ''}
              currentUserName={currentUser?.name ?? 'Usuario'}
              onToggleTask={(taskId, isCompleted, completedBy, completedByName, completedAt) => {
                const updatedTasks = project.tasks.map((t) =>
                  t.id === taskId
                    ? { ...t, isCompleted, ...(isCompleted ? { completedBy, completedByName, completedAt } : { completedBy: null, completedByName: null, completedAt: null }) }
                    : t
                );
                handleUpdate({ tasks: updatedTasks });
              }}
              onAddTask={(task) => handleUpdate({ tasks: [...(project.tasks ?? []), task] })}
              onRemoveTask={(taskId) => handleUpdate({ tasks: project.tasks.filter((t) => t.id !== taskId) })}
            />
          </TabsContent>

          <TabsContent value="extra-costs" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ExtraCostsList
              extraCosts={project.extraCosts ?? []}
              canEdit={isAdmin || isVendedor || isInstalador}
              currentUserId={currentUser?.id ?? ''}
              onAddExtraCost={(cost) => handleUpdate({ extraCosts: [...(project.extraCosts ?? []), cost] })}
              onRemoveExtraCost={(costId) => handleUpdate({ extraCosts: project.extraCosts?.filter((c) => c.id !== costId) ?? [] })}
            />
          </TabsContent>

          <TabsContent value="notes" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="rounded-xl border border-border bg-card p-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Historial de Notas y Comentarios
              </h3>
              <NotesTimeline
                notes={project.notes ?? []}
                currentUserId={currentUser?.id ?? ''}
                currentUserName={currentUser?.name ?? 'Usuario'}
                onAddNote={(note) => handleUpdate({ notes: [...(project.notes ?? []), note] })}
              />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
