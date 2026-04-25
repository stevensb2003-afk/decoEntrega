'use client';

import { useSettingsContext } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Trash2, PlusCircle, ArrowUp, ArrowDown, HelpCircle, ChevronsRight, ChevronsLeft, ChevronRight, ChevronLeft, SlidersHorizontal, GripVertical, Plus, X } from 'lucide-react';
import { FormQuestion, QuestionType, AppConfig, CSVExportColumn, Ticket, UserRole, UserRoles, NavPath, navLinksConfig } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, memo, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


type FormSection = 'ticketForm' | 'validationForm';

interface QuestionRowProps {
    question: FormQuestion;
    index: number;
    section: FormSection;
    questionCount: number;
    handleQuestionChange: (section: FormSection, index: number, field: keyof FormQuestion, value: any) => void;
    moveQuestion: (section: FormSection, index: number, direction: 'up' | 'down') => void;
    removeQuestion: (section: FormSection, index: number) => void;
}

const QuestionRow = memo(({ question, index, section, questionCount, handleQuestionChange, moveQuestion, removeQuestion }: QuestionRowProps) => {
    return (
        <div className="grid grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_120px_minmax(150px,1fr)_80px_80px_120px] gap-x-4 items-center bg-muted/50 p-2 rounded-md">
            <Input 
                defaultValue={question.id}
                onChange={(e) => handleQuestionChange(section, index, 'id', e.target.value)}
            />
            <Input 
                defaultValue={question.label}
                onChange={(e) => handleQuestionChange(section, index, 'label', e.target.value)}
            />
             <Select
                value={question.type}
                onValueChange={(value) => handleQuestionChange(section, index, 'type', value as QuestionType)}
            >
                <SelectTrigger className="bg-background">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="short-text">Short Text</SelectItem>
                    <SelectItem value="long-text">Long Text</SelectItem>
                    <SelectItem value="tel">Phone</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="signature">Firma</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                </SelectContent>
            </Select>
            <Input 
                defaultValue={question.optionsSource || question.options?.join(', ')}
                onChange={(e) => {
                    const value = e.target.value;
                    if (question.type === 'select') {
                       handleQuestionChange(section, index, 'optionsSource', value);
                    }
                }}
                disabled={question.type !== 'select'}
                placeholder={question.type === 'select' ? 'drivers, customers OR Yes,No' : 'N/A'}
            />
            <div className="flex items-center justify-center">
                <Switch
                    checked={question.visible}
                    onCheckedChange={(checked) => handleQuestionChange(section, index, 'visible', checked)}
                />
            </div>
            <div className="flex items-center justify-center">
                <Switch
                    checked={question.required}
                    onCheckedChange={(checked) => handleQuestionChange(section, index, 'required', checked)}
                    disabled={!question.visible}
                />
            </div>
            <div className="flex items-center justify-center gap-1">
                 <Button size="icon" variant="ghost" onClick={() => moveQuestion(section, index, 'up')} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => moveQuestion(section, index, 'down')} disabled={index === questionCount - 1}>
                    <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeQuestion(section, index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
});
QuestionRow.displayName = 'QuestionRow';


const QuestionEditor = ({ section, localConfig, setLocalConfig }: { section: FormSection, localConfig: AppConfig | null, setLocalConfig: React.Dispatch<React.SetStateAction<AppConfig | null>> }) => {
    if (!localConfig) return null;

    const questions = localConfig[section] as FormQuestion[];

    const handleQuestionChange = (section: FormSection, index: number, field: keyof FormQuestion, value: any) => {
        if (!localConfig) return;
        setLocalConfig(prevConfig => {
            if (!prevConfig) return null;
            const newConfig = JSON.parse(JSON.stringify(prevConfig));
            const newQuestions = newConfig[section] as FormQuestion[];
            
            const updatedQuestion = { ...newQuestions[index], [field]: value };
            
            if (field === 'visible' && !value) {
                updatedQuestion.required = false;
            }
            
            if (field === 'id') {
               updatedQuestion.id = value.replace(/\s+/g, '_').toLowerCase();
            }

            newQuestions[index] = updatedQuestion;
            return newConfig;
        });
    };

    const addQuestion = (section: FormSection) => {
        if (!localConfig) return;
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        const newQuestions = newConfig[section] as FormQuestion[];
        const newId = `new_question_${Date.now()}`;
        newQuestions.push({
            fieldId: newId,
            id: newId,
            label: 'New Question',
            type: 'short-text',
            visible: true,
            required: false,
            placeholder: '',
            optionsSource: ''
        });
        setLocalConfig(newConfig);
    };

    const removeQuestion = (section: FormSection, index: number) => {
        if (!localConfig) return;
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        const newQuestions = newConfig[section] as FormQuestion[];
        newQuestions.splice(index, 1);
        setLocalConfig(newConfig);
    };

    const moveQuestion = (section: FormSection, index: number, direction: 'up' | 'down') => {
        if (!localConfig) return;
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        const newQuestions = newConfig[section] as FormQuestion[];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newQuestions.length) return;

        const [movedQuestion] = newQuestions.splice(index, 1);
        newQuestions.splice(newIndex, 0, movedQuestion);
        setLocalConfig(newConfig);
    };

    return (
        <div className='space-y-4'>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="min-w-[1050px] md:w-full">
                    <div className="grid grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_120px_minmax(150px,1fr)_80px_80px_120px] gap-x-4 items-center font-medium px-2 pb-2">
                        <Label>ID / Key</Label>
                        <Label>Etiqueta</Label>
                        <Label>Tipo</Label>
                        <Label>Origen / Opciones</Label>
                        <Label className="text-center">Visible</Label>
                        <Label className="text-center">Requerido</Label>
                        <Label className="text-center">Acciones</Label>
                    </div>
                    <div className="space-y-2">
                    {questions.map((question, index) => (
                        <QuestionRow 
                            key={question.fieldId}
                            question={question}
                            index={index}
                            section={section}
                            questionCount={questions.length}
                            handleQuestionChange={handleQuestionChange}
                            moveQuestion={moveQuestion}
                            removeQuestion={removeQuestion}
                        />
                    ))}
                    </div>
                </div>
                 <ScrollBar orientation="horizontal" />
            </ScrollArea>
             <Button variant="outline" onClick={() => addQuestion(section)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Pregunta
            </Button>
        </div>
    )
};

const AvailableColumnItem = memo(({ item, onAdd }: { item: {id: string, label: string}, onAdd: (item: any) => void }) => {
    return (
        <div className="flex items-center justify-between p-3 rounded-md bg-background border shadow-sm hover:border-primary/50 transition-colors group">
            <span className="text-sm font-medium">{item.label}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 transition-opacity" onClick={() => onAdd(item)}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
});
AvailableColumnItem.displayName = 'AvailableColumnItem';

const SortableItem = ({ id, label, onRemove }: { id: string, label: string, onRemove: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={cn(
                "flex items-center justify-between p-3 rounded-md bg-background border shadow-sm transition-colors group relative",
                isDragging ? "border-primary shadow-md opacity-80" : "hover:border-primary/50"
            )}
        >
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 -ml-1">
                    <GripVertical className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive transition-opacity" onClick={() => onRemove(id)}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};

const CSVExportSettings = ({ localConfig, setLocalConfig, type = 'tickets' }: { localConfig: AppConfig | null, setLocalConfig: React.Dispatch<React.SetStateAction<AppConfig | null>>, type?: 'tickets' | 'projects' }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const allPossibleColumns: Omit<CSVExportColumn, 'enabled'>[] = useMemo(() => {
        if (!localConfig) return [];
        
        if (type === 'projects') {
            return [
                { id: 'id', label: 'ID Proyecto (Sistema)', group: 'general' },
                { id: 'projectId', label: 'ID Proyecto', group: 'general' },
                { id: 'clientName', label: 'Cliente', group: 'general' },
                { id: 'status', label: 'Estatus', group: 'general' },
                { id: 'ownerId', label: 'ID Vendedor', group: 'general' },
                { id: 'installerIds', label: 'IDs Instaladores', group: 'general' },
                { id: 'installationDate', label: 'Fecha Instalación', group: 'general' },
                { id: 'createdAt', label: 'Fecha de Creación', group: 'general' },
            ];
        }

        const ticketFormColumns = localConfig.ticketForm.map(q => ({ id: q.id as keyof Ticket, label: q.label, group: 'ticketForm' as const }));
        const validationFormColumns = localConfig.validationForm.map(q => ({ id: q.id as keyof Ticket, label: q.label, group: 'validationForm' as const }));
        
        const baseTicketColumns: Omit<CSVExportColumn, 'enabled'>[] = [
            { id: 'id', label: 'ID Tiquete (Sistema)', group: 'general' },
            { id: 'ticketId', label: 'ID Tiquete', group: 'general' },
            { id: 'status', label: 'Estatus', group: 'general' },
            { id: 'priority', label: 'Prioridad', group: 'general' },
            { id: 'ownerName', label: 'Nombre Vendedor', group: 'general' },
            { id: 'driverName', label: 'Nombre Chofer', group: 'general' },
            { id: 'createdAt', label: 'Fecha de Creación', group: 'general' },
            { id: 'updatedAt', label: 'Última Actualización', group: 'general' },
        ];
        const allIds = new Set(baseTicketColumns.map(c => c.id));
        const uniqueTicketFormColumns = ticketFormColumns.filter(c => !allIds.has(c.id));
        const uniqueValidationFormColumns = validationFormColumns.filter(c => !allIds.has(c.id));

        return [...baseTicketColumns, ...uniqueTicketFormColumns, ...uniqueValidationFormColumns];
    }, [localConfig?.ticketForm, localConfig?.validationForm, type]);


    const { selected, available } = useMemo(() => {
        if (!localConfig) return { selected: [], available: [] };
        
        const currentSelected = type === 'projects' ? (localConfig.projectCsvExportColumns || []) : (localConfig.csvExportColumns || []);
        const selectedIds = new Set(currentSelected.map(c => c.id));
        const available = allPossibleColumns.filter(p => !selectedIds.has(p.id as string));
        return { selected: currentSelected, available };
    }, [localConfig?.csvExportColumns, localConfig?.projectCsvExportColumns, allPossibleColumns, type]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setLocalConfig((prevConfig) => {
                if (!prevConfig) return null;
                
                if (type === 'projects') {
                    const items = prevConfig.projectCsvExportColumns || [];
                    const oldIndex = items.findIndex(item => item.id === active.id);
                    const newIndex = items.findIndex(item => item.id === over?.id);
                    return { 
                        ...prevConfig, 
                        projectCsvExportColumns: arrayMove(items, oldIndex, newIndex) 
                    };
                } else {
                    const items = prevConfig.csvExportColumns || [];
                    const oldIndex = items.findIndex(item => item.id === active.id);
                    const newIndex = items.findIndex(item => item.id === over?.id);
                    return { 
                        ...prevConfig, 
                        csvExportColumns: arrayMove(items, oldIndex, newIndex) 
                    };
                }
            });
        }
    };

    const handleAdd = (item: any) => {
        setLocalConfig(prevConfig => {
            if (!prevConfig) return null;
            if (type === 'projects') {
                const items = prevConfig.projectCsvExportColumns || [];
                return { ...prevConfig, projectCsvExportColumns: [...items, item] };
            } else {
                const items = prevConfig.csvExportColumns || [];
                return { ...prevConfig, csvExportColumns: [...items, item] };
            }
        });
    };

    const handleRemove = (id: string) => {
        setLocalConfig(prevConfig => {
            if (!prevConfig) return null;
            if (type === 'projects') {
                const items = prevConfig.projectCsvExportColumns || [];
                return { ...prevConfig, projectCsvExportColumns: items.filter(item => item.id !== id) };
            } else {
                const items = prevConfig.csvExportColumns || [];
                return { ...prevConfig, csvExportColumns: items.filter(item => item.id !== id) };
            }
        });
    };

    const handleAddAll = () => {
        setLocalConfig(prevConfig => {
            if (!prevConfig) return null;
            const field = type === 'projects' ? 'projectCsvExportColumns' : 'csvExportColumns';
            return { ...prevConfig, [field]: [...allPossibleColumns] };
        });
    };

    const handleRemoveAll = () => {
        setLocalConfig(prevConfig => {
            if (!prevConfig) return null;
            const field = type === 'projects' ? 'projectCsvExportColumns' : 'csvExportColumns';
            return { ...prevConfig, [field]: [] };
        });
    };

    if (!localConfig) return null;

    return (
        <div className="flex flex-col md:flex-row gap-6 p-2 md:p-4 bg-muted/10 rounded-xl border">
            {/* Available Columns */}
            <div className="flex-1 flex flex-col min-w-[280px]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground/80">Columnas Disponibles</h3>
                    <Button variant="ghost" size="sm" onClick={handleAddAll} disabled={available.length === 0} className="text-xs">
                        <ChevronsRight className="h-4 w-4 mr-1 md:rotate-0 rotate-90" /> Agregar Todas
                    </Button>
                </div>
                <div className="flex-1 bg-muted/20 border rounded-xl p-3 min-h-[300px] max-h-[50vh] overflow-y-auto space-y-2">
                    {available.length > 0 ? available.map((item) => (
                        <AvailableColumnItem key={item.id as string} item={item as any} onAdd={handleAdd} />
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-4 text-center">
                            <SlidersHorizontal className="h-8 w-8 mb-2 opacity-20" />
                            <p>Todas las columnas han sido seleccionadas.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Columns */}
            <div className="flex-1 flex flex-col min-w-[280px]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground/80">Columnas a Exportar</h3>
                    <Button variant="ghost" size="sm" onClick={handleRemoveAll} disabled={selected.length === 0} className="text-xs text-destructive hover:text-destructive">
                        <ChevronsLeft className="h-4 w-4 mr-1 md:rotate-0 -rotate-90" /> Quitar Todas
                    </Button>
                </div>
                <div className="flex-1 bg-background border shadow-inner rounded-xl p-3 min-h-[300px] max-h-[50vh] overflow-y-auto">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={selected.map(i => i.id as string)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {selected.length > 0 ? selected.map((item) => (
                                    <SortableItem key={item.id as string} id={item.id as string} label={item.label} onRemove={handleRemove} />
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-4 text-center">
                                        <p>No hay columnas seleccionadas para exportar.</p>
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </div>
    );
};


export default function SettingsPage() {
    const { config: remoteConfig, isLoading, updateConfig } = useSettingsContext();
    const [localConfig, setLocalConfig] = useState<AppConfig | null>(null);
    const [initialConfig, setInitialConfig] = useState<AppConfig | null>(null);
    const { currentUser, isUserLoading, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (remoteConfig) {
            const configCopy = JSON.parse(JSON.stringify(remoteConfig));
            setLocalConfig(configCopy);
            setInitialConfig(JSON.parse(JSON.stringify(remoteConfig)));
        }
    }, [remoteConfig]);

    useEffect(() => {
        if (!isUserLoading && currentUser && !hasRole('admin')) {
            router.replace('/dashboard');
        }
    }, [currentUser, isUserLoading, router, hasRole]);

    const haveChanges = useMemo(() => JSON.stringify(localConfig) !== JSON.stringify(initialConfig), [localConfig, initialConfig]);

    if (isLoading || isUserLoading || !localConfig) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!hasRole('admin')) {
        return null;
    }

    const handleSave = () => {
        if (localConfig) {
            updateConfig(localConfig);
            setInitialConfig(JSON.parse(JSON.stringify(localConfig)));
        }
    };
    
    const handleMaxDeliveriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalConfig(prev => {
            if (!prev) return null;
            return { ...prev, maxDeliveriesPerDay: parseInt(value, 10) || 0 };
        })
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-8">
            <div className='flex justify-between items-start'>
                <header>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Editor de Formularios y Configuraciones</h1>
                    <p className="text-muted-foreground">
                        Personaliza los formularios y exportaciones de tu aplicación.
                    </p>
                </header>
                <Button onClick={handleSave} disabled={!haveChanges}>
                    <Save className="mr-2" />
                    Guardar Cambios
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuraciones Generales</CardTitle>
                    <CardDescription>Ajustes globales de la aplicación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="max-w-xs space-y-2">
                       <Label htmlFor='maxDeliveries'>Máximo de entregas por día</Label>
                       <Input 
                        id='maxDeliveries'
                        type='number' 
                        value={localConfig.maxDeliveriesPerDay}
                        onChange={handleMaxDeliveriesChange}
                        min={1}
                       />
                       <p className='text-sm text-muted-foreground'>Este valor se usa para mostrar alertas de sobrecarga.</p>
                   </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Formulario para Nuevo Ticket</CardTitle>
                    <CardDescription>Configura los campos para crear un nuevo ticket de entrega.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <QuestionEditor section="ticketForm" localConfig={localConfig} setLocalConfig={setLocalConfig} />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Formulario para Validación de Entrega</CardTitle>
                    <CardDescription>Configura los campos para el formulario de validación de entrega.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <QuestionEditor section="validationForm" localConfig={localConfig} setLocalConfig={setLocalConfig} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Exportación CSV</CardTitle>
                    <CardDescription>
                        Selecciona y ordena las columnas a exportar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue="tickets" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="tickets">Tiquetes</TabsTrigger>
                            <TabsTrigger value="projects">Instalaciones</TabsTrigger>
                        </TabsList>
                        <TabsContent value="tickets" className="mt-4">
                            <CSVExportSettings localConfig={localConfig} setLocalConfig={setLocalConfig} type="tickets" />
                        </TabsContent>
                        <TabsContent value="projects" className="mt-4">
                            <CSVExportSettings localConfig={localConfig} setLocalConfig={setLocalConfig} type="projects" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

        </div>
    );
}
