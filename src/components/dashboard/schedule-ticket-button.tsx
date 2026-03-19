'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/contexts/app-context';
import { useState, useEffect, useMemo } from 'react';
import { CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { User, FormQuestion, Customer, Ticket } from '@/lib/types';
import { useSettingsContext } from '@/contexts/settings-context';
import { getDaysInMonth, getYear, getMonth, getDate, format } from 'date-fns';
import { LocationPicker } from '../ui/location-picker';

const baseFormSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  addressLink: z.string().optional(),
  locationLat: z.number().optional().nullable(),
  locationLng: z.number().optional().nullable(),
  locationdetails: z.string().optional(),
  ordernumber: z.string().optional(),
  notes: z.string().optional(),
  driverId: z.string().optional(),
  deliveryDay: z.string().optional(),
  deliveryMonth: z.string().optional(),
  deliveryYear: z.string().optional(),
});
type FormData = z.infer<typeof baseFormSchema>;

// Helper function to get an array of numbers
const getNumericRange = (start: number, end: number) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function ScheduleTicketButton() {
  const { addTicket, users, customers, tickets, blockedDates } = useAppContext();
  const { config, isLoading: isSettingsLoading } = useSettingsContext();
  const [open, setOpen] = useState(false);
  const [nextTicketId, setNextTicketId] = useState('');

  const drivers = users.filter((u: User) => {
      const r = u.roles || (u.role ? [u.role] : []);
      return r.includes('chofer');
  });

  const form = useForm<FormData>({
    resolver: (data, context, options) => {
        const ticketFormConfig = config?.ticketForm;
        if (!ticketFormConfig) {
            return zodResolver(z.object({}))(data, context, options);
        }

        const baseShape: z.ZodRawShape = {};
        
        ticketFormConfig.forEach(question => {
            if (question.visible && question.type !== 'date') {
                let fieldSchema: z.ZodTypeAny;
                switch(question.type) {
                    case 'url':
                        fieldSchema = z.string().url('Please enter a valid URL');
                        break;
                    case 'tel':
                        fieldSchema = z.string().min(7, 'Please enter a valid phone number');
                        break;
                    case 'short-text':
                    case 'long-text':
                    default:
                        fieldSchema = z.string().min(2, 'Input must be at least 2 characters');
                        break;
                    case 'select':
                        fieldSchema = z.string().min(1, 'Por favor, realice una selección');
                        break;
                }
                if (!question.required) {
                    fieldSchema = fieldSchema.optional().or(z.literal(''));
                }
                baseShape[question.id as keyof FormData] = fieldSchema;
            }
        });
        

        // Add separate fields for date
        baseShape['deliveryDay'] = z.string().min(1, 'Day is required');
        baseShape['deliveryMonth'] = z.string().min(1, 'Month is required');
        baseShape['deliveryYear'] = z.string().min(1, 'Year is required');

        // Allow location coordinates to be passed through mapping
        baseShape['locationLat'] = z.number().optional().nullable();
        baseShape['locationLng'] = z.number().optional().nullable();
        baseShape['locationdetails'] = z.string().optional();

        const dynamicSchema = z.object(baseShape);
        return zodResolver(dynamicSchema)(data, context, options);
    }
  });
  
  const selectedYear = parseInt(form.watch('deliveryYear') || '0', 10);
  const selectedMonth = parseInt(form.watch('deliveryMonth') || '0', 10);
  const selectedDay = parseInt(form.watch('deliveryDay') || '0', 10);
  
  const daysInSelectedMonth = useMemo(() => {
      if (!isNaN(selectedYear) && !isNaN(selectedMonth)) {
          return getDaysInMonth(new Date(selectedYear, selectedMonth));
      }
      return getDaysInMonth(new Date());
  }, [selectedYear, selectedMonth]);

  const isDateBlocked = useMemo(() => {
    if (isNaN(selectedYear) || isNaN(selectedMonth) || isNaN(selectedDay)) {
        return false;
    }
    const dateKey = format(new Date(selectedYear, selectedMonth, selectedDay), 'yyyy-MM-dd');
    return blockedDates.some(d => d.id === dateKey);
  }, [selectedYear, selectedMonth, selectedDay, blockedDates]);

  useEffect(() => {
    if (isDateBlocked) {
        form.setError('deliveryDay', { type: 'manual', message: 'This date is blocked.' });
    } else {
        form.clearErrors('deliveryDay');
    }
  }, [isDateBlocked, form]);

  useEffect(() => {
    if (open) {
        let defaultValues: Partial<FormData> = {};

        if (config?.ticketForm) {
            defaultValues = config.ticketForm.reduce((acc, q) => {
                 if (q.type !== 'date') {
                    acc[q.id as keyof FormData] = '';
                }
                return acc;
            }, {} as Partial<FormData>);
        }
        
        const today = new Date();
        defaultValues.deliveryDay = String(getDate(today));
        defaultValues.deliveryMonth = String(getMonth(today));
        defaultValues.deliveryYear = String(getYear(today));
        
        form.reset(defaultValues);
        
        const nextTicketNumber = (tickets?.length || 0) + 1;
        const formattedTicketId = `ETG-${String(nextTicketNumber).padStart(4, '0')}`;
        setNextTicketId(formattedTicketId);
    }
  }, [open, config, form, tickets]);

  function onSubmit(values: FormData) {
    if (isDateBlocked) {
        return; // Double-check block before submission
    }
    const { deliveryDay, deliveryMonth, deliveryYear, ...restOfValues } = values;
    const deliveryDate = new Date(parseInt(deliveryYear!), parseInt(deliveryMonth!), parseInt(deliveryDay!));
    
    const finalTicketData = {
        ...restOfValues,
        deliveryDate,
    };
    
    addTicket(finalTicketData as Omit<Ticket, 'id' | 'ticketId' | 'createdAt' | 'updatedAt' | 'ownerId' | 'status' | 'priority'>, nextTicketId);
    setOpen(false);
  }

  if (isSettingsLoading || !config?.ticketForm) {
    return <Button disabled><CalendarIcon className="mr-2 h-4 w-4" />Loading Config...</Button>
  }
  
  const renderField = (field: any, question: FormQuestion) => {
    switch (question.type) {
        case 'select':
             return (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={question.placeholder || 'Seleccionar'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {question.optionsSource === 'drivers' && drivers.map((driver: User) => (
                      <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                    ))}
                    {question.optionsSource === 'customers' && customers.map((customer: Customer) => (
                      <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                    ))}
                    {question.options && question.options.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            );
        case 'long-text':
            return <Textarea placeholder={question.placeholder} {...field} />;
        case 'url':
            if (question.id === 'addressLink') {
                return (
                    <LocationPicker 
                        value={field.value || ''}
                        onChange={(url, lat, lng, details) => {
                            field.onChange(url);
                            form.setValue('locationLat', lat, { shouldDirty: true });
                            form.setValue('locationLng', lng, { shouldDirty: true });
                            if (details) {
                                form.setValue('locationdetails', details, { shouldDirty: true });
                            }
                        }}
                        placeholder={question.placeholder}
                    />
                );
            }
            return <Input placeholder={question.placeholder} type="url" {...field} />;
        case 'short-text':
        case 'tel':
        default:
            return <Input placeholder={question.placeholder} type={question.type === 'short-text' ? 'text' : question.type} {...field} />;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Agendar Entrega
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.pac-container')) {
                e.preventDefault();
            }
        }}
      >
        <DialogHeader>
          <DialogTitle>Agendar Nueva Entrega</DialogTitle>
          <DialogDescription>
            Ingrese los detalles y seleccione una fecha de entrega. El número de tiquete <span className='font-bold text-foreground'>{nextTicketId}</span> será generado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            {config.ticketForm.filter(q => q.visible && q.type !== 'date').map(question => (
                 <FormField
                    key={question.fieldId}
                    control={form.control}
                    name={question.id as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{question.label} {question.required && '*'}</FormLabel>
                          <FormControl>
                            {renderField(field, question)}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            ))}
            
            {/* Date Dropdowns */}
            <FormItem>
                <FormLabel>Fecha de Entrega *</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                    <FormField
                        control={form.control}
                        name="deliveryDay"
                        render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Día" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {getNumericRange(1, daysInSelectedMonth).map(day => (
                                            <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="deliveryMonth"
                        render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Mes" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {monthNames.map((month, index) => (
                                            <SelectItem key={month} value={String(index)}>{month}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="deliveryYear"
                        render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Año" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {getNumericRange(getYear(new Date()), getYear(new Date()) + 5).map(year => (
                                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                </div>
                 <FormMessage />
            </FormItem>
            
            <Button type="submit" className="w-full" disabled={isDateBlocked}>Agendar Tiquete</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
