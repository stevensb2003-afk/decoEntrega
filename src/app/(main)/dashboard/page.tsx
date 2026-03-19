'use client';

import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { NewTicketButton } from "@/components/dashboard/new-ticket-button";
import { ScheduleTicketButton } from "@/components/dashboard/schedule-ticket-button";
import { useAppContext } from "@/contexts/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, User, Filter, X } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User as UserType } from '@/lib/types';
import { useSettingsContext } from "@/contexts/settings-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const OverbookedAlert = () => {
    const { ticketsByDay } = useAppContext();
    const { config } = useSettingsContext();
    const maxDeliveries = config?.maxDeliveriesPerDay || 5;

    const overbookedDays = useMemo(() => {
        return Object.entries(ticketsByDay)
            .filter(([_, tickets]) => tickets.length > maxDeliveries)
            .map(([date]) => date);
    }, [ticketsByDay, maxDeliveries]);

    if (overbookedDays.length === 0) {
        return null;
    }

    return (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Alerta de Sobrecarga</AlertTitle>
            <AlertDescription>
                Los siguientes días tienen más de {maxDeliveries} entregas asignadas:
                <ul className="list-disc list-inside mt-2 font-semibold">
                    {overbookedDays.map(date => (
                        <li key={date}>{format(new Date(date), 'PPP', { locale: es })}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
};


export default function DashboardPage() {
  const { users } = useAppContext();
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);

  const sellers = useMemo(() => {
    return users.filter((u: UserType) => {
        const r = u.roles || (u.role ? [u.role] : []);
        return r.includes('admin') || r.includes('vendedor');
    });
  }, [users]);
  
  const handleSellerFilterChange = (sellerId: string) => {
    setSelectedSellerIds(prev => {
        const isSelected = prev.includes(sellerId);
        if (isSelected) {
            return prev.filter(id => id !== sellerId);
        } else {
            return [...prev, sellerId];
        }
    });
  };
  
  const getSelectedSellersText = () => {
    if (selectedSellerIds.length === 0) return "Filtrar por vendedor";
    if (selectedSellerIds.length === sellers.length) return "Todos los Vendedores";
    if (selectedSellerIds.length === 1) {
        const seller = sellers.find(s => s.id === selectedSellerIds[0]);
        return seller?.name || "1 Vendedor";
    }
    return `${selectedSellerIds.length} Vendedores`;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Pizarra de Pendientes</h1>
          <TooltipProvider>
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className='relative'>
                                <Filter className="h-4 w-4" /> 
                                {selectedSellerIds.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{selectedSellerIds.length}</span>}
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{getSelectedSellersText()}</p>
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuLabel>Filtrar por vendedor</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuCheckboxItem
                        checked={selectedSellerIds.length === sellers.length || selectedSellerIds.length === 0}
                        onCheckedChange={(checked) => setSelectedSellerIds(checked ? sellers.map(s => s.id) : [])}
                        onSelect={(e) => e.preventDefault()}
                    >
                        Todos los Vendedores
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {sellers.map(seller => (
                        <DropdownMenuCheckboxItem
                            key={seller.id}
                            checked={selectedSellerIds.includes(seller.id)}
                            onCheckedChange={() => handleSellerFilterChange(seller.id)}
                            onSelect={(e) => e.preventDefault()}
                        >
                            {seller.name}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
           {selectedSellerIds.length > 0 && <Button variant="ghost" size="sm" onClick={() => setSelectedSellerIds([])}><X className="mr-2 h-4 w-4" /> Limpiar</Button>}
        </div>
        <div className="flex gap-2">
          <NewTicketButton />
          <ScheduleTicketButton />
        </div>
      </div>
      <OverbookedAlert />
      <KanbanBoard selectedSellerIds={selectedSellerIds} />
    </div>
  );
}
