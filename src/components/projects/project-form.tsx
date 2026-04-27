'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LocationPicker } from '@/components/ui/location-picker';
import { InstallerSelect } from './installer-select';
import { useAppContext } from '@/contexts/app-context';
import { User, ProjectTask, ProjectMaterial } from '@/lib/types';
import {
  Plus, Trash2, CheckSquare, Package, Loader2, CalendarDays, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstallationTypes, InstallationUnits, InstallationType, InstallationUnit } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Zod Schema ─────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  customerName: z.string().min(2, 'Nombre del cliente requerido'),
  customerPhone: z.string().min(8, 'Número de contacto requerido'),
  locationDetails: z.string().min(5, 'Ubicación requerida'),
  installerIds: z.array(z.string()).min(1, 'Asigna al menos un instalador'),
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  applyStartTime: z.boolean().default(true),
  startTime: z.string().optional(),
  isOneDay: z.boolean(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  costoTotal: z.coerce.number().min(0).optional(),
  costoInst: z.coerce.number().min(0).optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
}).refine(
  (d) => d.isOneDay || (d.endDate && d.endDate >= d.startDate),
  { message: 'La fecha de cierre debe ser igual o posterior al inicio', path: ['endDate'] }
);

type FormData = z.infer<typeof schema>;

// ─── Props ───────────────────────────────────────────────────────────────────
interface ProjectFormProps {
  installers: User[];
  nextProjectId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];

// ─── Component ───────────────────────────────────────────────────────────────
export function ProjectForm({ installers, nextProjectId }: ProjectFormProps) {
  const { addProject } = useAppContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic lists
  const [tasks, setTasks] = useState<Omit<ProjectTask, 'createdAt'>[]>([]);
  const [materials, setMaterials] = useState<Omit<ProjectMaterial, 'createdAt'>[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [materialInput, setMaterialInput] = useState<{name: string, quantity: string, unit: string}>({ name: '', quantity: '1', unit: 'm²' });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      customerName: '',
      customerPhone: '',
      locationDetails: '',
      installerIds: [],
      startDate: today,
      applyStartTime: true,
      startTime: '08:00',
      isOneDay: true,
      endDate: '',
      description: '',
      costoTotal: undefined,
      costoInst: undefined,
    },
  });

  const isOneDay = form.watch('isOneDay');

  // ── Task helpers ─────────────────────────────────────────────────────────
  const addTask = () => {
    const title = taskInput.trim();
    if (!title) return;
    setTasks((prev) => [...prev, { id: uuidv4(), title, isCompleted: false }]);
    setTaskInput('');
  };

  const removeTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  // ── Material helpers ──────────────────────────────────────────────────────
  const addMaterial = () => {
    const name = materialInput.name.trim();
    const qty = parseFloat(materialInput.quantity);
    if (!name || isNaN(qty) || qty <= 0) return;
    setMaterials((prev) => [
      ...prev,
      { id: uuidv4(), name: name as InstallationType, quantity: qty, unit: materialInput.unit as InstallationUnit, description: '' },
    ]);
    setMaterialInput({ name: '', quantity: '1', unit: 'm²' });
  };

  const removeMaterial = (id: string) => setMaterials((prev) => prev.filter((m) => m.id !== id));

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    const now = new Date().toISOString();

    // Auto-add pending material if present
    const name = materialInput.name.trim();
    const qty = parseFloat(materialInput.quantity);
    let finalMaterials = [...materials];
    if (name && !isNaN(qty) && qty > 0) {
      finalMaterials.push({
        id: uuidv4(),
        name: name as InstallationType,
        quantity: qty,
        unit: materialInput.unit as InstallationUnit,
        description: ''
      });
    }

    // Auto-add pending task if present
    const tTitle = taskInput.trim();
    let finalTasks = [...tasks];
    if (tTitle) {
      finalTasks.push({ id: uuidv4(), title: tTitle, isCompleted: false });
    }

    const payload = {
      name: values.name,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      locationDetails: values.locationDetails,
      installerIds: values.installerIds,
      startDate: values.startDate,
      startTime: values.applyStartTime ? (values.startTime ?? '') : '',
      isOneDay: values.isOneDay,
      endDate: values.isOneDay ? values.startDate : (values.endDate ?? values.startDate),
      description: values.description ?? '',
      costoTotal: values.costoTotal,
      costoInst: values.costoInst,
      locationLat: values.locationLat,
      locationLng: values.locationLng,
      tasks: finalTasks.map((t) => ({ ...t, createdAt: now })),
      materials: finalMaterials.map((m) => ({ ...m, createdAt: now })),
      extraCosts: [],
      payments: [],
      notes: [],
    };
    addProject(payload, nextProjectId);
    router.push('/projects');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Section: Info general ────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            Información General
          </h2>

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Proyecto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Instalación de pisos – Casa Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="customerName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="customerPhone" render={({ field }) => (
              <FormItem>
                <FormLabel>Contacto / Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+506 8888-8888" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles adicionales del proyecto…"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </section>

        {/* ── Section: Ubicación ───────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            Ubicación
          </h2>
          <FormField control={form.control} name="locationDetails" render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección / Punto de instalación</FormLabel>
              <FormControl>
                <LocationPicker
                  value={field.value}
                  onChange={(_url, _lat, _lng, address) => {
                    field.onChange(address ?? _url);
                    if (_lat) form.setValue('locationLat', _lat);
                    if (_lng) form.setValue('locationLng', _lng);
                  }}
                  placeholder="Buscar dirección o marcar en mapa…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </section>

        {/* ── Section: Fechas ──────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            <CalendarDays className="inline h-4 w-4 mr-1.5" />
            Fechas y Hora de Inicio
          </h2>

          <FormField control={form.control} name="isOneDay" render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="isOneDay"
                />
              </FormControl>
              <Label htmlFor="isOneDay" className="cursor-pointer font-normal">
                Proyecto de 1 solo día
              </Label>
            </FormItem>
          )} />

          {/* Date row + start time */}
          <div className={cn('grid gap-4', isOneDay ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
            <FormField control={form.control} name="startDate" render={({ field }) => (
              <FormItem>
                <FormLabel>{isOneDay ? 'Fecha' : 'Fecha de Inicio'}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {!isOneDay && (
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Cierre</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <div className="space-y-3">
              <FormField control={form.control} name="applyStartTime" render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 pt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="applyStartTime"
                    />
                  </FormControl>
                  <Label htmlFor="applyStartTime" className="cursor-pointer font-normal text-sm">
                    Aplica hora de inicio
                  </Label>
                </FormItem>
              )} />

              {form.watch('applyStartTime') && (
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      Hora Exacta
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>
          </div>
        </section>

        {/* ── Section: Instaladores y Finanzas ─────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            Instalación y Finanzas
          </h2>
          <FormField control={form.control} name="installerIds" render={({ field }) => (
            <FormItem>
              <FormLabel>Instaladores Asignados</FormLabel>
              <FormControl>
                <InstallerSelect
                  installers={installers}
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.installerIds?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <FormField control={form.control} name="costoTotal" render={({ field }) => (
              <FormItem>
                <FormLabel>Costo Total Proyecto</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-muted-foreground">₡</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      className="pl-7" 
                      placeholder="0" 
                      {...field}
                      value={field.value ?? ''}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="costoInst" render={({ field }) => (
              <FormItem>
                <FormLabel>Mano de Obra</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-muted-foreground">₡</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      className="pl-7" 
                      placeholder="0" 
                      {...field}
                      value={field.value ?? ''}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </section>

        {/* ── Section: Tareas ──────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            <CheckSquare className="inline h-4 w-4 mr-1.5" />
            Tareas <span className="text-muted-foreground normal-case font-normal text-xs">(opcional)</span>
          </h2>

          {/* Add task input */}
          <div className="flex gap-2">
            <Input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Ej: Preparar superficie del piso…"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addTask} aria-label="Agregar tarea">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Task list */}
          {tasks.length > 0 && (
            <ul className="space-y-1.5">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <CheckSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{t.title}</span>
                  <button type="button" onClick={() => removeTask(t.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Section: Materiales a Instalar ───────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            <Package className="inline h-4 w-4 mr-1.5" />
            Materiales a Instalar <span className="text-muted-foreground normal-case font-normal text-xs">(requerido)</span>
          </h2>

          {/* Add material inputs */}
          <div className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-end">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Tipo de Instalación</Label>
              <Select value={materialInput.name} onValueChange={(val) => setMaterialInput((p) => ({ ...p, name: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {InstallationTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Cantidad</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={materialInput.quantity}
                onChange={(e) => setMaterialInput((p) => ({ ...p, quantity: e.target.value }))}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Unidad</Label>
              <Select value={materialInput.unit} onValueChange={(val) => setMaterialInput((p) => ({ ...p, unit: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Unidad" />
                </SelectTrigger>
                <SelectContent>
                  {InstallationUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" size="icon" onClick={addMaterial} className="mb-0.5" aria-label="Agregar material">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Material list */}
          {materials.length > 0 && (
            <ul className="space-y-1.5">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{m.quantity} {m.unit}</span>
                  </span>
                  <button type="button" onClick={() => removeMaterial(m.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => router.push('/projects')} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none sm:ml-auto">
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</>
            ) : (
              `Crear ${nextProjectId}`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
