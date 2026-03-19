'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Undo2, User as UserIcon, Calendar, Truck, FileText, Star, Hash, ImageIcon, ClipboardList, Edit } from 'lucide-react';
import { ValidationModal } from './validation-modal';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format } from 'date-fns';
import { useSettingsContext } from '@/contexts/settings-context';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { EditTicketModal } from './edit-ticket-modal';
import { useState } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { Ticket } from '@/lib/types';


export const TicketDetailsModal = ({ ticket, isOpen, onOpenChange }: { ticket: Ticket; isOpen: boolean; onOpenChange: (open: boolean) => void; }) => {
    const { users, reverseTicketConfirmation } = useAppContext();
    const { config } = useSettingsContext();
    const { currentUser } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const isAdmin = currentUser?.roles?.includes('admin') || currentUser?.role === 'admin';
    const owner = users.find(u => u.id === ticket.ownerId);
    const driver = users.find(u => u.id === ticket.driverId);
    const isValidationComplete = !!ticket.satisfaction;
    
    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date instanceof Timestamp) return format(date.toDate(), 'PPp');
        return format(new Date(date), 'PPp');
    }

    const renderTicketFormData = () => {
        if (!config) return null;

        const ticketFields = config.ticketForm.map(question => {
            // @ts-ignore
            let value = ticket[question.id];
            if (!question.visible || !value) return null;
            
            // Special handling for driverId to show name
            if (question.id === 'driverId') {
                const driverUser = users.find(u => u.id === value);
                value = driverUser?.name || 'No asignado';
            }

            if (question.type === 'date') {
                return (
                    <div key={question.fieldId} className="flex items-start gap-3">
                       <Calendar className="w-5 h-5 text-primary mt-1" />
                       <div className='flex-1'>
                           <p className="font-semibold">{question.label}</p>
                           <p className="text-muted-foreground">{formatDate(value)}</p>
                       </div>
                   </div>
                )
            }

            return (
                 <div key={question.fieldId} className="flex items-start gap-3">
                    <ClipboardList className="w-5 h-5 text-primary mt-1" />
                    <div className='flex-1'>
                        <p className="font-semibold">{question.label}</p>
                        {question.type === 'url' ? (
                            <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{value}</a>
                        ) : (
                            <p className="text-muted-foreground">{String(value)}</p>
                        )}
                    </div>
                </div>
            )
        }).filter(Boolean);

        if (ticketFields.length === 0) return null;

        return (
             <>
                <Separator className="my-4" />
                <h4 className="text-md font-semibold mb-3">Información del Tiquete</h4>
                <div className="space-y-4">
                    {ticketFields}
                </div>
            </>
        )
    }

    const renderValidationData = () => {
        if (!config || !ticket.satisfaction) return null; // Only show if validation is complete

        const validationFields = config.validationForm.map(question => {
            // @ts-ignore
            const value = ticket[question.id];
            if (!question.visible || !value) return null;

            let content = <p className="text-muted-foreground">{String(value)}</p>;
            if (question.type === 'rating' && typeof value === 'number') {
                content = (
                    <div className='flex'>
                        {Array.from({length: 5}).map((_, i) => (
                           <Star key={i} className={`w-5 h-5 ${i < value ? 'text-accent fill-accent' : 'text-muted'}`}/>
                        ))}
                    </div>
                )
            } else if ((question.type === 'photo' || question.type === 'signature') && typeof value === 'string' && value.startsWith('data:image')) {
                const label = question.type === 'signature' ? "Firma de Recepción" : question.label;
                return (
                     <div key={question.fieldId} className="flex flex-col items-start gap-2">
                        <p className="font-semibold">{label}</p>
                        <div className="w-full aspect-video relative rounded-md border bg-white">
                            <Image src={value} alt={question.label} fill style={{ objectFit: 'contain'}} className="rounded-md" />
                        </div>
                    </div>
                )
            }

            return (
                 <div key={question.fieldId} className="flex items-center gap-3">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <div className='flex-1'>
                        <p className="font-semibold">{question.label}</p>
                        {content}
                    </div>
                </div>
            )

        }).filter(Boolean);

        if (validationFields.length === 0) return null;

        return (
            <>
                <Separator className="my-4" />
                <h4 className="text-md font-semibold mb-3">Datos de Validación</h4>
                <div className="space-y-4">
                    {validationFields}
                </div>
            </>
        )
    }
    
    return (
        <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detalles del Tiquete: {ticket.ticketId}</DialogTitle>
                    <DialogDescription>
                        Información completa de la entrega para {ticket.customerName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 text-sm max-h-[70vh] overflow-y-auto px-1">
                    {/* Basic Info */}
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div className='flex-1'>
                            <p className="font-semibold">Estatus Actual</p>
                            <p className="text-muted-foreground">{ticket.status}</p>
                        </div>
                    </div>
                    
                    {renderTicketFormData()}

                    <Separator className="my-4" />
                    {/* Assignment & Timing */}
                    <h4 className="text-md font-semibold mb-3">Asignación y Tiempos</h4>
                     <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-primary" />
                        <div className='flex-1'>
                            <p className="font-semibold">Prioridad</p>
                            <p className="text-muted-foreground">{ticket.priority}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-primary" />
                        <div className='flex-1'>
                            <p className="font-semibold">Vendedor</p>
                            <p className="text-muted-foreground">{owner?.name || 'No asignado'}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-primary" />
                        <div className='flex-1'>
                            <p className="font-semibold">Chofer</p>
                            <p className="text-muted-foreground">{driver?.name || 'No asignado'}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div className='flex-1'>
                            <p className="font-semibold">Fecha de Creación</p>
                            <p className="text-muted-foreground">{formatDate(ticket.createdAt)}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div className='flex-1'>
                            <p className="font-semibold">Última Actualización</p>
                            <p className="text-muted-foreground">{formatDate(ticket.updatedAt)}</p>
                        </div>
                    </div>
                    {/* Validation Data */}
                    {renderValidationData()}
                </div>
                 <DialogFooter className="flex-row justify-between w-full">
                     <div>
                        {isValidationComplete && isAdmin && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Undo2 className="mr-2 h-4 w-4" /> Revertir
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Revert Confirmation?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Hacer esto va a devolver el estatus a 'En Ruta' y elimina la información de validación para volver a hacer el proceso ¿Estás seguro?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => reverseTicketConfirmation(ticket.id)}>
                                            Yes, Revert
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    <div className='flex gap-2'>
                        {ticket.status !== 'Entregado' && (
                            <>
                                <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                                    <Edit className='mr-2 h-4 w-4'/>Editar Tiquete
                                </Button>
                                <ValidationModal ticket={ticket}>
                                    <Button 
                                        variant={isValidationComplete ? "outline" : "default"} 
                                        disabled={ticket.status !== 'En Ruta' && !isValidationComplete}
                                    >
                                        {isValidationComplete ? <>Validado</> : 'Validar Entrega'}
                                    </Button>
                                </ValidationModal>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <EditTicketModal ticket={ticket} isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
        </>
    )
}
