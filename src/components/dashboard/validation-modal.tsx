'use client';

import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Trash2 } from 'lucide-react';
import { Ticket, FormQuestion, User, Customer } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { cn } from '@/lib/utils';
import { useSettingsContext } from '@/contexts/settings-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface ValidationModalProps {
    ticket: Ticket;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const baseFormSchema = z.object({
  satisfaction: z.number().optional(),
  proofOfDeliveryUrl: z.string().optional(),
});
type FormData = z.infer<typeof baseFormSchema>;

export function ValidationModal({ ticket, children, open: controlledOpen, onOpenChange: setControlledOpen }: ValidationModalProps) {
  const { updateTicketValidation, users, customers } = useAppContext();
  const { config, isLoading: isSettingsLoading } = useSettingsContext();
  const [internalOpen, setInternalOpen] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);
  
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const validationFormConfig = config?.validationForm;
  const drivers = users.filter((u: User) => {
      const r = u.roles || (u.role ? [u.role] : []);
      return r.includes('chofer');
  });

  const form = useForm<FormData>({
    resolver: (data, context, options) => {
        if (!validationFormConfig) {
            return zodResolver(z.object({}))(data, context, options);
        }

        const shape = validationFormConfig.reduce((acc, question) => {
            if (question.visible) {
                let fieldSchema: z.ZodTypeAny;
                switch(question.type) {
                    case 'rating':
                        fieldSchema = question.required ? z.number().min(1, 'Rating is required') : z.number();
                        break;
                    case 'photo':
                    case 'signature':
                        fieldSchema = question.required ? z.string().min(1, 'This field is required') : z.string();
                        break;
                    case 'select':
                         fieldSchema = z.string().min(1, 'Por favor, realice una selección');
                         break;
                    default:
                        fieldSchema = question.required ? z.string().min(1, 'This field is required') : z.string();
                        break;
                }
                if (!question.required) {
                    fieldSchema = fieldSchema.optional().or(z.literal(''));
                }
                acc[question.id as keyof FormData] = fieldSchema;
            }
            return acc;
        }, {} as z.ZodRawShape);

        const dynamicSchema = z.object(shape);
        return zodResolver(dynamicSchema)(data, context, options);
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if(open && validationFormConfig) {
      const defaultValues = validationFormConfig.reduce((acc, q) => {
        // @ts-ignore
        const ticketValue = ticket[q.id];
        let defaultValue: string | number = '';
        if (q.type === 'rating') {
            defaultValue = ticketValue || 0;
        } else {
            defaultValue = ticketValue || '';
        }
        return {...acc, [q.id]: defaultValue};
      }, {});
      form.reset(defaultValues as FormData);
    }
  }, [open, validationFormConfig, ticket, form]);

  const clearSignature = () => {
    sigPadRef.current?.clear();
    const sigField = validationFormConfig?.find(q => q.type === 'signature')?.id;
    if (sigField) {
        form.setValue(sigField as keyof FormData, '', { shouldValidate: true, shouldDirty: true });
    }
  }

  const handleSignatureEnd = () => {
    if (sigPadRef.current) {
        const sigField = validationFormConfig?.find(q => q.type === 'signature')?.id;
        if (sigField) {
            const dataUrl = sigPadRef.current.toDataURL();
            form.setValue(sigField as keyof FormData, dataUrl, { shouldValidate: true, shouldDirty: true });
        }
    }
  };

  const onSubmit = (data: FormData) => {
      const sigField = validationFormConfig?.find(q => q.type === 'signature')?.id;
      if (sigField && sigPadRef.current && !sigPadRef.current.isEmpty()) {
        (data as any)[sigField] = sigPadRef.current.toDataURL();
      }

      updateTicketValidation(ticket.id, data);
      setOpen(false);
  };
  
  if (isSettingsLoading || !validationFormConfig) {
      if (children) return React.cloneElement(children as React.ReactElement<{ disabled?: boolean }>, { disabled: true });
      return null;
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
            case 'rating':
                return (
                     <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Button
                            key={star}
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => field.onChange(star)}
                            className="text-muted-foreground hover:text-accent-foreground"
                            >
                            <Star
                                className={cn(
                                'w-8 h-8 transition-colors',
                                field.value >= star ? 'text-accent fill-accent' : ''
                                )}
                            />
                            </Button>
                        ))}
                    </div>
                );
            case 'signature':
                return (
                     <div className='space-y-2'>
                        <div className="w-full aspect-video rounded-md border border-dashed flex items-center justify-center relative bg-muted/50">
                             <SignatureCanvas 
                                ref={sigPadRef} 
                                penColor='black' 
                                canvasProps={{className: 'w-full h-full'}}
                                onEnd={handleSignatureEnd}
                             />
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Limpiar Firma
                        </Button>
                    </div>
                );
            case 'photo': // Fallback for photo if it's still in config
                return (
                    <p className='text-sm text-destructive'>El tipo de campo "Photo" ya no es compatible. Cámbielo a "Signature".</p>
                )
            case 'long-text':
                return <Textarea placeholder={question.placeholder} {...field} />;
            case 'short-text':
            case 'tel':
            case 'url':
            default:
                return <Input placeholder={question.placeholder} type={question.type === 'short-text' ? 'text' : question.type} {...field} />;
        }
    }


  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validar Entrega de {ticket.ticketId}</DialogTitle>
          <DialogDescription>
            Registre la satisfacción del cliente y capture su firma.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            {validationFormConfig.filter(q => q.visible).map(question => (
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
          <DialogFooter className="mt-6 pt-4 border-t sticky bottom-0 bg-background z-10">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid}>
              Validar Entrega
            </Button>
          </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}