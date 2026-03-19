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
import { PlusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { User, FormQuestion, Customer, Ticket } from '@/lib/types';
import { useSettingsContext } from '@/contexts/settings-context';
import { format, isSunday } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { LocationPicker } from '../ui/location-picker';

// Define a base schema that represents all possible fields.
// react-hook-form needs this to correctly type `form.control`.
const baseFormSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  addressLink: z.string().optional(),
  ordernumber: z.string().optional(),
  notes: z.string().optional(),
  driverId: z.string().optional(),
  deliveryDate: z.date().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  locationdetails: z.string().optional(),
});
type FormData = z.infer<typeof baseFormSchema>;


export function NewTicketButton() {
  const { addTicket, users, customers, tickets, blockedDates } = useAppContext();
  const { config, isLoading: isSettingsLoading } = useSettingsContext();
  const [open, setOpen] = useState(false);
  const [nextTicketId, setNextTicketId] = useState('');

  const drivers = users.filter((u: User) => {
      const r = u.roles || (u.role ? [u.role] : []);
      return r.includes('chofer');
  });
  
  const ticketFormConfig = useMemo(() => {
    return config?.ticketForm.filter(q => q.type !== 'date');
  }, [config]);

  const isTodayBlocked = useMemo(() => {
    const today = new Date();
    const dateKey = format(today, 'yyyy-MM-dd');
    const manualBlock = blockedDates.find(d => d.id === dateKey);

    if (manualBlock) {
        // Blocked if manually blocked, unless explicitly unblocked (for Sundays)
        return manualBlock.reason !== 'Unblocked by User';
    }
    // Blocked if it's a Sunday with no specific rule
    return isSunday(today);
  }, [blockedDates]);
  
  const form = useForm<FormData>({
    resolver: (data, context, options) => {
        // Dynamic schema generation for validation
        if (!ticketFormConfig) {
            // If config is not ready, validate against an empty schema
            return zodResolver(z.object({}))(data, context, options);
        }
        
        const shape = ticketFormConfig.reduce((acc, question) => {
            if (question.visible) {
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
                acc[question.id as keyof FormData] = fieldSchema;
            }
            return acc;
        }, {} as z.ZodRawShape);

        shape['locationLat'] = z.number().optional();
        shape['locationLng'] = z.number().optional();
        shape['locationdetails'] = z.string().optional();

        const dynamicSchema = z.object(shape);
        return zodResolver(dynamicSchema)(data, context, options);
    },
  });

  useEffect(() => {
    if (open) {
        if (ticketFormConfig) {
            const defaultValues = ticketFormConfig.reduce((acc, q) => ({...acc, [q.id]: ''}), {});
            form.reset(defaultValues as FormData);
        }
        const nextTicketNumber = (tickets?.length || 0) + 1;
        const formattedTicketId = `ETG-${String(nextTicketNumber).padStart(4, '0')}`;
        setNextTicketId(formattedTicketId);
    }
  }, [open, ticketFormConfig, form, tickets]);

  function onSubmit(values: FormData) {
    addTicket(values as Omit<Ticket, 'id' | 'ticketId' | 'createdAt' | 'updatedAt' | 'ownerId' | 'status' | 'priority'>, nextTicketId);
    setOpen(false);
  }

  if (isSettingsLoading || !ticketFormConfig) {
    return <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Loading Config...</Button>
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
        case 'short-text':
        case 'tel':
        case 'url':
             if (question.type === 'url' && question.id === 'addressLink') {
                 return (
                     <LocationPicker 
                         value={field.value} 
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

  const triggerButton = (
      <Button disabled={isTodayBlocked}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Entrega
      </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isTodayBlocked ? (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* The disabled button needs a wrapper for Tooltip to work */}
                        <div tabIndex={0}>{triggerButton}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>No se pueden crear tiquetes en días bloqueados.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        ) : (
            triggerButton
        )}
      </DialogTrigger>
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
          <DialogTitle>Nueva Entrega</DialogTitle>
          <DialogDescription>
            Ingrese los detalles de la orden a continuación. El número de tiquete <span className='font-bold text-foreground'>{nextTicketId}</span> será generado para entrega hoy.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            {ticketFormConfig.filter(q => q.visible).map(question => (
                 <FormField
                    key={question.id}
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
            <Button type="submit" className="w-full">Crear Tiquete</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
