'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { User, FormQuestion, Customer, Ticket } from '@/lib/types';
import { useSettingsContext } from '@/contexts/settings-context';
import { cn } from '@/lib/utils';
import { format, parseISO, getDaysInMonth, getYear, getMonth, getDate } from 'date-fns';
import { Timestamp, FieldValue } from 'firebase/firestore';
import { LocationPicker } from '../ui/location-picker';


interface EditTicketModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define a base schema that represents all possible fields.
const baseFormSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  addressLink: z.string().optional(),
  ordernumber: z.string().optional(),
  notes: z.string().optional(),
  driverId: z.string().optional(),
  deliveryDay: z.string().optional(),
  deliveryMonth: z.string().optional(),
  deliveryYear: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  locationdetails: z.string().optional(),
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


export function EditTicketModal({ ticket, isOpen, onOpenChange }: EditTicketModalProps) {
  const { updateTicket, users, customers, blockedDates } = useAppContext();
  const { config, isLoading: isSettingsLoading } = useSettingsContext();

  const drivers = users.filter((u: User) => {
      const r = u.roles || (u.role ? [u.role] : []);
      return r.includes('chofer');
  });
  const ticketFormConfig = config?.ticketForm;
  
  const form = useForm<FormData>({
    resolver: (data, context, options) => {
        if (!ticketFormConfig) {
            return zodResolver(z.object({}))(data, context, options);
        }

        const shape = ticketFormConfig.reduce((acc, question) => {
            if (question.visible && question.type !== 'date') {
                let fieldSchema: z.ZodTypeAny;
                switch (question.type) {
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
                acc[question.id as keyof FormData] = fieldSchema;
            }
            return acc;
        }, {} as z.ZodRawShape);

        // Add separate fields for date
        shape['deliveryDay'] = z.string().optional();
        shape['deliveryMonth'] = z.string().optional();
        shape['deliveryYear'] = z.string().optional();
        
        shape['locationLat'] = z.number().optional();
        shape['locationLng'] = z.number().optional();
        shape['locationdetails'] = z.string().optional();

        const dynamicSchema = z.object(shape);
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
    if (isOpen && ticketFormConfig) {
      const defaultValues: Partial<FormData> = {};
      
      ticketFormConfig.forEach(q => {
        if(q.type !== 'date') {
          // @ts-ignore
          defaultValues[q.id as keyof FormData] = ticket[q.id] || '';
        }
      });

      let initialDate = new Date();
      if (ticket.deliveryDate) {
        if (ticket.deliveryDate instanceof Timestamp) {
            initialDate = ticket.deliveryDate.toDate();
        } else if (typeof ticket.deliveryDate === 'string') {
            initialDate = parseISO(ticket.deliveryDate);
        }
      }
      
      defaultValues.deliveryDay = String(getDate(initialDate));
      defaultValues.deliveryMonth = String(getMonth(initialDate));
      defaultValues.deliveryYear = String(getYear(initialDate));
      
      form.reset(defaultValues);
    }
  }, [isOpen, ticketFormConfig, ticket, form]);

  function onSubmit(values: FormData) {
    if (isDateBlocked) return;
    
    const { deliveryDay, deliveryMonth, deliveryYear, ...restOfValues } = values;
    
    let updatedData: Partial<Ticket> = { ...restOfValues };

    if (deliveryDay && deliveryMonth && deliveryYear) {
      updatedData.deliveryDate = Timestamp.fromDate(new Date(parseInt(deliveryYear), parseInt(deliveryMonth), parseInt(deliveryDay))) as unknown as FieldValue;
    }
    
    updateTicket(ticket.id, updatedData as any);
    onOpenChange(false);
  }

  if (isSettingsLoading || !ticketFormConfig) {
    return null;
  }
  
  const hasDateField = ticketFormConfig.some(q => q.type === 'date' && q.visible);
  
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
        case 'short-text':
        case 'tel':
        case 'url':
             if (question.type === 'url' && question.id === 'addressLink') {
                 return (
                     <LocationPicker 
                         value={field.value}
                         initialLat={ticket.locationLat as number | undefined}
                         initialLng={ticket.locationLng as number | undefined}
                         onChange={(url, lat, lng, addr) => {
                             field.onChange(url);
                             if (lat !== undefined && lng !== undefined) {
                                  form.setValue('locationLat' as any, lat);
                                  form.setValue('locationLng' as any, lng);
                             }
                             // Removed automatic setting of locationdetails to avoid "D" bug
                         }} 
                         placeholder={question.placeholder || "Buscar ubicación en el mapa..."} 
                     />
                 );
             }
             return <Input placeholder={question.placeholder} type={question.type === 'short-text' ? 'text' : question.type} {...field} />;
        default:
            return <Input placeholder={question.placeholder} type="text" {...field} />;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => {
              const target = e.target as Element;
              if (target?.closest('.pac-container')) {
                  e.preventDefault();
              }
          }}
      >
        <DialogHeader>
          <DialogTitle>Edit Ticket {ticket.ticketId}</DialogTitle>
          <DialogDescription>
            Modify the details for this delivery ticket.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            {ticketFormConfig.filter(q => q.visible && q.type !== 'date').map(question => (
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

            {hasDateField && (
                 <FormItem>
                    <FormLabel>Fecha de Entrega</FormLabel>
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
                    <FormMessage>
                        {form.formState.errors.deliveryDay?.message}
                    </FormMessage>
                </FormItem>
            )}

            <Button type="submit" className="w-full" disabled={isDateBlocked}>Guardar Cambios</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
