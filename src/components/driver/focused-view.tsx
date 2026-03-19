'use client';

import { useAppContext } from '@/contexts/app-context';
import { useUser } from '@/firebase';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Copy, MapPin, Phone, CheckCircle, Hash, User as UserIcon, MessageSquare, Info, Banknote, CheckCircle2 } from 'lucide-react';
import { Ticket, User } from '@/lib/types';
import { ValidationModal } from '../dashboard/validation-modal';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const NoDeliveries = () => (
    <Card className="text-center py-12">
        <CardHeader>
            <CardTitle>Todo Completado!</CardTitle>
            <CardDescription>No tienes entregas pendientes.</CardDescription>
        </CardHeader>
    </Card>
)

export function FocusedView() {
  const { user: currentUser } = useUser();
  const { getDriverTickets, users } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const { toast } = useToast();

  if (!currentUser) return null;
  
  const appUser = users.find((u: User) => u.id === currentUser.uid);
  const isAdmin = appUser && (appUser.role === 'admin' || (appUser.roles && appUser.roles.includes('admin')));
  
  const effectiveUserId = selectedDriverId || currentUser.uid;
  const tickets = getDriverTickets(effectiveUserId);
  
  const drivers = users.filter((u: User) => {
      const r = u.roles || (u.role ? [u.role] : []);
      return r.includes('chofer');
  });

  const currentTicket: Ticket | undefined = tickets[currentIndex];
  const owner = currentTicket ? users.find((u: User) => u.id === currentTicket.ownerId) : undefined;
  const isValidationComplete = currentTicket ? !!currentTicket.satisfaction : false;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tickets.length);
  };
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + tickets.length) % tickets.length);
  };

  const copyToClipboard = (text: string) => {
    if(navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({ title: "Copiado al portapapeles!", description: text });
    }
  }

  return (
    <div className="space-y-4 w-full">
      {isAdmin && (
        <div className="space-y-2 mb-2 p-3 bg-muted/20 border rounded-lg shadow-sm">
           <p className="text-sm font-semibold text-muted-foreground ml-1">Vista de Administrador</p>
           <Select value={selectedDriverId || currentUser.uid} onValueChange={(val) => {
                setSelectedDriverId(val);
                setCurrentIndex(0);
            }}>
                <SelectTrigger className="w-full bg-background font-medium">
                    <SelectValue placeholder="Seleccionar Chofer" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={currentUser.uid}>Mis Entregas (Admin)</SelectItem>
                    {drivers.map((driver: User) => (
                        <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      )}

      {tickets.length === 0 ? (
        <NoDeliveries />
      ) : currentTicket && (
        <>
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="bg-muted/30 p-4">
                <div className='flex justify-between items-start'>
                  <div className="space-y-1">
                    <CardDescription>Entrega #{currentIndex + 1} de {tickets.length}</CardDescription>
                    <CardTitle className="text-2xl font-bold font-headline">{currentTicket.customerName}</CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-bold text-lg text-foreground">{currentTicket.ticketId}</div>
                    {currentTicket.paymentmethod && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "px-2 py-1 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]",
                          currentTicket.paymentmethod.toLowerCase().includes('contra entrega') 
                            ? "bg-orange-100 text-orange-700 border-orange-200" 
                            : "bg-green-100 text-green-700 border-green-200"
                        )}
                      >
                        {currentTicket.paymentmethod.toLowerCase().includes('contra entrega') 
                          ? <Banknote className="w-3.5 h-3.5" /> 
                          : <CheckCircle2 className="w-3.5 h-3.5" />
                        }
                        {currentTicket.paymentmethod}
                      </Badge>
                    )}
                  </div>
                </div>
            </CardHeader>
        <CardContent className="p-4 space-y-4 text-base">
            
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{currentTicket.customerPhone}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(currentTicket.customerPhone)}>
                    <Copy className="w-4 h-4 mr-2" /> Copiar
                </Button>
            </div>
            <Separator/>
             <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-medium text-foreground">Ubicación de entrega</span>
                  </div>
               </div>
               <div className="flex flex-wrap gap-2">
                 {currentTicket.locationLat && currentTicket.locationLng ? (
                     <>
                         <a href={`https://www.google.com/maps/search/?api=1&query=${currentTicket.locationLat},${currentTicket.locationLng}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                             <Button variant="default" size="sm" className="w-full">Google Maps</Button>
                         </a>
                         <a href={`https://waze.com/ul?ll=${currentTicket.locationLat},${currentTicket.locationLng}&navigate=yes`} target="_blank" rel="noopener noreferrer" className="flex-1">
                             <Button variant="secondary" size="sm" className="w-full">Waze</Button>
                         </a>
                     </>
                 ) : (
                     <a href={currentTicket.addressLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                         <Button variant="default" size="sm" className="w-full">Abrir vínculo</Button>
                     </a>
                 )}
               </div>
            </div>

            {currentTicket.ordernumber && (
              <>
              <Separator />
              <div className="flex items-center gap-3 text-muted-foreground">
                  <Hash className="w-5 h-5 text-primary flex-shrink-0" />
                   <div className='text-sm'>
                    <p className='text-xs'>Número de Orden</p>
                    <span className="font-medium text-foreground">{currentTicket.ordernumber}</span>
                  </div>
              </div>
              </>
            )}

            <Separator/>
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className='flex-1'>
                    <p className="font-medium text-sm text-muted-foreground">Detalles de ubicación:</p>
                    {currentTicket.locationdetails ? (
                        <p className="font-medium text-foreground whitespace-pre-wrap">{currentTicket.locationdetails}</p>
                    ) : (
                        <p className="font-normal text-muted-foreground italic">No hay detalles de ubicación.</p>
                    )}
                </div>
            </div>
           
            <Separator />
            <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className='flex-1'>
                    <p className="font-medium text-sm text-muted-foreground">Notas Adicionales:</p>
                    {currentTicket.notes ? (
                        <p className="font-medium text-foreground whitespace-pre-wrap">{currentTicket.notes}</p>
                    ) : (
                        <p className="font-normal text-muted-foreground italic">No hay notas adicionales.</p>
                    )}
                </div>
            </div>

            {owner && (
               <>
               <Separator />
               <div className="flex items-center gap-3 text-muted-foreground">
                  <UserIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className='text-sm'>
                    <p className="text-xs">Vendedor:</p>
                    <span className="font-medium text-foreground">{owner.name}</span>
                  </div>
              </div>
              </>
            )}
        </CardContent>
        <CardFooter className="bg-muted/30 p-2">
           <ValidationModal ticket={currentTicket}>
                <Button 
                    className={`w-full ${isValidationComplete ? 'bg-green-600 hover:bg-green-700' : ''}`} 
                    size="lg" 
                    disabled={currentTicket.status !== 'En Ruta' && !isValidationComplete}
                >
                    {isValidationComplete ? <><CheckCircle className='mr-2 h-4 w-4'/>Confirmado</> : 'Completar y Validar Entrega'}
                </Button>
            </ValidationModal>
        </CardFooter>
      </Card>
      
      <div className="flex justify-between items-center p-1">
        <Button size="lg" variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft className="mr-2 h-5 w-5" /> Anterior
        </Button>
        <Button size="lg" variant="outline" onClick={handleNext} disabled={currentIndex === tickets.length - 1}>
          Siguiente <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
      </>
      )}
    </div>
  );
}
