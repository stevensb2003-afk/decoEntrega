'use client';

import { useState } from 'react';
import { ProjectTask } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, CheckSquare, User2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

interface TaskListProps {
  tasks: ProjectTask[];
  canEdit: boolean;
  currentUserId: string;
  currentUserName: string;
  onToggleTask: (taskId: string, isCompleted: boolean, completedBy?: string, completedByName?: string, completedAt?: string) => void;
  onAddTask: (task: ProjectTask) => void;
  onRemoveTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  canEdit,
  currentUserId,
  currentUserName,
  onToggleTask,
  onAddTask,
  onRemoveTask,
}: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const completed = tasks.filter((t) => t.isCompleted).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleToggle = (task: ProjectTask) => {
    if (task.isCompleted) {
      onToggleTask(task.id, false);
    } else {
      onToggleTask(task.id, true, currentUserId, currentUserName, new Date().toISOString());
    }
  };

  const handleAdd = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    onAddTask({
      id: uuidv4(),
      title,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });
    setNewTaskTitle('');
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM, HH:mm", { locale: es });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Add new task */}
      {canEdit && (
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Nueva tarea…"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          />
          <Button type="button" variant="outline" size="icon" onClick={handleAdd} aria-label="Agregar tarea">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Progress Header */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {completed}/{total} completadas
            </span>
            <span className={cn(
              'font-semibold tabular-nums',
              progress === 100 ? 'text-emerald-600' : 'text-muted-foreground'
            )}>
              {progress}%
            </span>
          </div>
          <Progress
            value={progress}
            className={cn('h-2', progress === 100 && '[&>div]:bg-emerald-500')}
          />
        </div>
      )}

      {/* Task list */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
          <CheckSquare className="h-10 w-10 opacity-20" />
          <p className="text-sm">No hay tareas todavía</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={cn(
                'group rounded-lg border bg-card p-3 transition-colors',
                task.isCompleted ? 'border-emerald-200 bg-emerald-50/50' : 'border-border'
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.isCompleted}
                  onCheckedChange={() => handleToggle(task)}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={cn(
                      'block text-sm cursor-pointer leading-snug',
                      task.isCompleted && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title}
                  </label>

                  {/* Completed meta */}
                  {task.isCompleted && (task as any).completedByName && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User2 className="h-3 w-3" />
                        {(task as any).completedByName}
                      </span>
                      {(task as any).completedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate((task as any).completedAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Remove button — only for editors */}
                {canEdit && !task.isCompleted && (
                  <button
                    type="button"
                    onClick={() => onRemoveTask(task.id)}
                    className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Eliminar tarea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
