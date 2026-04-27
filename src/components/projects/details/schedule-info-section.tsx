import { Project, User } from '@/lib/types';
import { Calendar, User2, Pencil, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { InlineEditField } from './inline-edit-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ScheduleInfoSectionProps {
  project: Project;
  users: User[];
  canEdit: boolean;
  onUpdate: (update: Partial<Project>) => void;
}

export function ScheduleInfoSection({ project, users, canEdit, onUpdate }: ScheduleInfoSectionProps) {
  const formatDate = (dateStr: string | any): string => {
    try {
      const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr?.seconds * 1000);
      return format(d, "d 'de' MMMM, yyyy", { locale: es });
    } catch { return '—'; }
  };

  const assignedInstallers = users.filter((u) => project.installerIds?.includes(u.id));
  const availableInstallers = users.filter((u) => 
    u.roles?.includes('instalador') || u.role === 'instalador'
  );
  
  const creator = users.find((u) => u.id === project.ownerId);

  const toggleInstaller = (userId: string) => {
    const currentIds = project.installerIds || [];
    const newIds = currentIds.includes(userId)
      ? currentIds.filter(id => id !== userId)
      : [...currentIds, userId];
    onUpdate({ installerIds: newIds });
  };

  const handleIsOneDayChange = (checked: boolean) => {
    const update: Partial<Project> = { isOneDay: checked };
    if (checked) {
      update.endDate = project.startDate;
    }
    onUpdate(update);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Calendar className="inline h-3.5 w-3.5 mr-1" />
            Fecha{!project.isOneDay ? 's' : ''}
          </h3>

          {canEdit && (
            <div 
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 hover:border-border hover:bg-muted transition-all cursor-pointer group select-none"
              onClick={() => handleIsOneDayChange(!project.isOneDay)}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary transition-colors">
                1 DÍA
              </span>
              <Switch 
                id="isOneDay" 
                checked={project.isOneDay} 
                onCheckedChange={handleIsOneDayChange}
                onClick={(e) => e.stopPropagation()}
                className="scale-90 data-[state=checked]:bg-primary"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-2 pt-1">
          <InlineEditField
            label={project.isOneDay ? "Fecha" : "Inicio"}
            value={typeof project.startDate === 'string' ? project.startDate : ''}
            onSave={(val) => {
               if (project.isOneDay) {
                 onUpdate({ startDate: val, endDate: val });
               } else {
                 onUpdate({ startDate: val });
               }
            }}
            canEdit={canEdit}
            type="date"
            className="flex-1"
          />
          
          {!project.isOneDay && (
             <InlineEditField
                label="Fin"
                value={typeof project.endDate === 'string' ? project.endDate : ''}
                onSave={(val) => onUpdate({ endDate: val })}
                canEdit={canEdit}
                type="date"
                className="flex-1"
             />
          )}

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
            <span className="text-sm font-medium text-muted-foreground">Hora de inicio</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {(typeof project.startTime === 'string' && project.startTime.length > 0) ? 'Aplica' : 'No aplica'}
              </span>
              <Switch 
                checked={typeof project.startTime === 'string' && project.startTime.length > 0} 
                onCheckedChange={(checked) => onUpdate({ startTime: checked ? '08:00' : '' })}
                disabled={!canEdit}
                className="scale-90"
              />
            </div>
          </div>
          
          {(typeof project.startTime === 'string' && project.startTime.length > 0) && (
            <InlineEditField
              label="Hora"
              value={project.startTime}
              onSave={(val) => onUpdate({ startTime: val })}
              canEdit={canEdit}
              type="time"
              className="flex-1"
            />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <User2 className="inline h-3.5 w-3.5 mr-1" />
            Instaladores
          </h3>
          
          {canEdit && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-3 border-b border-border bg-muted/30">
                  <p className="text-xs font-semibold uppercase tracking-wider">Asignar Instaladores</p>
                </div>
                <ScrollArea className="h-64">
                  <div className="p-2 space-y-1">
                    {availableInstallers.map((installer) => {
                      const isSelected = project.installerIds?.includes(installer.id);
                      return (
                        <div 
                          key={installer.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                          onClick={() => toggleInstaller(installer.id)}
                        >
                          <Checkbox 
                            id={`installer-${installer.id}`} 
                            checked={isSelected}
                            onCheckedChange={() => toggleInstaller(installer.id)}
                          />
                          <label
                            htmlFor={`installer-${installer.id}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {installer.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {assignedInstallers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin asignar</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {assignedInstallers.map((u) => (
              <Badge key={u.id} variant="secondary" className="font-medium text-xs py-0 h-5">
                {u.name}
              </Badge>
            ))}
          </div>
        )}
        
        {creator && (
          <p className="text-xs text-muted-foreground pt-1">
            Creado por <span className="font-medium text-foreground">{creator.name}</span>
          </p>
        )}
      </section>
    </div>
  );
}
