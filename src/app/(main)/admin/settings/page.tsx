'use client';

import { useSettingsContext } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Trash2, PlusCircle, ArrowUp, ArrowDown, HelpCircle, ChevronsRight, ChevronsLeft, ChevronRight, ChevronLeft, SlidersHorizontal, GripVertical } from 'lucide-react';
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

const ColumnList = memo(({ title, items, checkedItems, onToggle, showOrder = false, onReorder }: { title: string, items: {id: string, label: string}[], checkedItems: Set<string>, onToggle: (id: string) => void, showOrder?: boolean, onReorder?: (dragIndex: number, hoverIndex: number) => void }) => {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDrop = () => {
        if (onReorder && dragItem.current !== null && dragOverItem.current !== null) {
            onReorder(dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="space-y-3 min-w-[250px]">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div
                className="border rounded-lg min-h-[300px] max-h-[50vh] overflow-y-auto p-2 space-y-1 bg-muted/20"
                onDrop={showOrder ? handleDrop : undefined}
                onDragOver={showOrder ? handleDragOver : undefined}
                onDragEnd={handleDragEnd}
            >
                {items.length > 0 ? items.map((item, index) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-background border border-transparent has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50"
                        draggable={showOrder}
                        onDragStart={showOrder ? (e) => handleDragStart(e, index) : undefined}
                        onDragEnter={showOrder ? () => handleDragEnter(index) : undefined}
                    >
                        <Checkbox
                            id={`col-${item.id}`}
                            checked={checkedItems.has(item.id)}
                            onCheckedChange={() => onToggle(item.id)}
                        />
                        <label htmlFor={`col-${item.id}`} className="flex-1 text-sm font-medium cursor-pointer">{item.label}</label>
                        {showOrder && onReorder && (
                            <div className="cursor-grab">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-full">
                        <p>No hay columnas aquí.</p>
                    </div>
                )}
            </div>
        </div>
    );
});
ColumnList.displayName = 'ColumnList';

const CSVExportSettings = ({ localConfig, setLocalConfig }: { localConfig: AppConfig | null, setLocalConfig: React.Dispatch<React.SetStateAction<AppConfig | null>> }) => {
    const [checkedAvailable, setCheckedAvailable] = useState<Set<string>>(new Set());
    const [checkedSelected, setCheckedSelected] = useState<Set<string>>(new Set());

    const allPossibleColumns: Omit<CSVExportColumn, 'enabled'>[] = useMemo(() => {
        if (!localConfig) return [];
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
    }, [localConfig?.ticketForm, localConfig?.validationForm]);


    const { selected, available } = useMemo(() => {
        if (!localConfig) return { selected: [], available: [] };
        const selectedIds = new Set(localConfig.csvExportColumns.map(c => c.id));
        const selected = localConfig.csvExportColumns || [];
        const available = allPossibleColumns.filter(p => !selectedIds.has(p.id));
        return { selected, available };
    }, [localConfig?.csvExportColumns, allPossibleColumns]);
    
    useEffect(() => {
        setCheckedAvailable(new Set());
        setCheckedSelected(new Set());
    }, [selected.length, available.length])

    const handleToggle = (id: string, list: 'available' | 'selected') => {
        const set = list === 'available' ? setCheckedAvailable : setCheckedSelected;
        set(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleMove = (direction: 'toSelected' | 'toAvailable') => {
        setLocalConfig(prevConfig => {
            if (!prevConfig) return null;

            if (direction === 'toSelected') {
                const itemsToMove = available.filter(item => checkedAvailable.has(item.id as string));
                const newSelected = [...prevConfig.csvExportColumns, ...itemsToMove];
                return { ...prevConfig, csvExportColumns: newSelected };
            } else {
                const newSelected = prevConfig.csvExportColumns.filter(item => !checkedSelected.has(item.id as string));
                return { ...prevConfig, csvExportColumns: newSelected };
            }
        });
    };

    const handleMoveAll = (direction: 'toSelected' | 'toAvailable') => {
        setLocalConfig(prevConfig => {
            if (!prevConfig) return null;
            if (direction === 'toSelected') {
                return { ...prevConfig, csvExportColumns: [...allPossibleColumns] };
            } else {
                return { ...prevConfig, csvExportColumns: [] };
            }
        });
    }

    const reorderSelectedColumns = (dragIndex: number, hoverIndex: number) => {
        setLocalConfig(prev => {
            if (!prev) return null;
            const newConfig = JSON.parse(JSON.stringify(prev));
            const items = newConfig.csvExportColumns;
            const [draggedItem] = items.splice(dragIndex, 1);
            items.splice(hoverIndex, 0, draggedItem);
            return newConfig;
        });
    };
    
    if (!localConfig) return null;
    

    return (
        <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
            <div className="flex flex-col md:flex-row gap-4 items-start p-4">
                <ColumnList title="Columnas Disponibles" items={available as {id: string; label: string}[]} checkedItems={checkedAvailable} onToggle={(id) => handleToggle(id, 'available')} />
                
                <div className="flex flex-row md:flex-col gap-2 mt-0 md:mt-16 justify-center w-full md:w-auto">
                     <Button variant="outline" size="icon" onClick={() => handleMoveAll('toSelected')} disabled={available.length === 0} aria-label="Agregar todas las columnas">
                        <ChevronsRight className="h-5 w-5 md:rotate-0" />
                    </Button>
                     <Button variant="outline" size="icon" onClick={() => handleMove('toSelected')} disabled={checkedAvailable.size === 0} aria-label="Agregar columnas seleccionadas">
                        <ChevronRight className="h-5 w-5 md:rotate-0" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleMove('toAvailable')} disabled={checkedSelected.size === 0} aria-label="Quitar columnas seleccionadas">
                        <ChevronLeft className="h-5 w-5 md:rotate-0" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleMoveAll('toAvailable')} disabled={selected.length === 0} aria-label="Quitar todas las columnas">
                        <ChevronsLeft className="h-5 w-5 md:rotate-0" />
                    </Button>
                </div>

                <ColumnList 
                    title="Columnas Seleccionadas y Orden"
                    items={selected as {id: string; label: string}[]}
                    checkedItems={checkedSelected}
                    onToggle={(id) => handleToggle(id, 'selected')}
                    onReorder={reorderSelectedColumns}
                    showOrder
                />
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
                        Selecciona y ordena las columnas a exportar. Marca los campos en una lista y muévelos a la otra.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <CSVExportSettings localConfig={localConfig} setLocalConfig={setLocalConfig} />
                </CardContent>
            </Card>

        </div>
    );
}
