'use client';

import * as React from 'react';
import 'react-day-picker/style.css';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  Row,
  RowData,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


import { Ticket, TicketStatuses, ProjectStatuses, User } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { ListFilter, Calendar as CalendarIcon, X, Download, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfDay, endOfDay, startOfWeek, endOfMonth, startOfYear, endOfYear, getDaysInMonth, getYear, getMonth, endOfWeek, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { FieldValue, Timestamp } from 'firebase/firestore';
import { useSettingsContext } from '@/contexts/settings-context';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import { HistoryMetrics } from '@/components/history/history-metrics';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onFilteredRowsChange: (count: number) => void;
  entityName?: 'tiquetes' | 'instalaciones';
  showMetrics?: boolean;
  showStatusFilter?: boolean;
  showOwnerFilter?: boolean;
}


// --- Custom Date Selector Component ---
const getNumericRange = (start: number, end: number) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

interface CustomDateSelectorProps {
  label: string;
  dateValue: { day: string, month: string, year: string };
  onDateChange: (part: 'day' | 'month' | 'year', value: string) => void;
}

const CustomDateSelector: React.FC<CustomDateSelectorProps> = ({ label, dateValue, onDateChange }) => {
  const [openSelect, setOpenSelect] = React.useState<'day' | 'month' | 'year' | null>(null);

  const selectedYear = parseInt(dateValue.year, 10);
  const selectedMonth = parseInt(dateValue.month, 10);
  
  const daysInSelectedMonth = React.useMemo(() => {
    if (!isNaN(selectedYear) && !isNaN(selectedMonth)) {
      return getDaysInMonth(new Date(selectedYear, selectedMonth));
    }
    return 31;
  }, [selectedYear, selectedMonth]);

  const handleOpenChange = (part: 'day' | 'month' | 'year', isOpen: boolean) => {
    setOpenSelect(isOpen ? part : null);
  }

  return (
    <div className="p-2 space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="grid grid-cols-3 gap-2">
            <Select 
                value={dateValue.day} 
                onValueChange={(v) => onDateChange('day', v)}
                open={openSelect === 'day'}
                onOpenChange={(isOpen) => handleOpenChange('day', isOpen)}
            >
                <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                <SelectContent>
                    {getNumericRange(1, daysInSelectedMonth).map(day => (
                        <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select 
                value={dateValue.month} 
                onValueChange={(v) => onDateChange('month', v)}
                open={openSelect === 'month'}
                onOpenChange={(isOpen) => handleOpenChange('month', isOpen)}
            >
                 <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                 <SelectContent>
                    {monthNames.map((month, index) => (
                        <SelectItem key={month} value={String(index)}>{month}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select 
                value={dateValue.year} 
                onValueChange={(v) => onDateChange('year', v)}
                open={openSelect === 'year'}
                onOpenChange={(isOpen) => handleOpenChange('year', isOpen)}
            >
                <SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger>
                <SelectContent>
                    {getNumericRange(getYear(new Date()) - 5, getYear(new Date()) + 5).map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    </div>
  )
}

// --- Main DataTable Component ---
export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  onFilteredRowsChange,
  entityName = 'tiquetes',
  showMetrics = true,
  showStatusFilter = true,
  showOwnerFilter = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  
  // State for date presets
  const [selectedPreset, setSelectedPreset] = React.useState<string>('');

  // State for custom date range
  const [fromDate, setFromDate] = React.useState({ day: '', month: '', year: '' });
  const [toDate, setToDate] = React.useState({ day: '', month: '', year: '' });

  const { users } = useAppContext();
  const { config: settingsConfig } = useSettingsContext();
  const vendors = users.filter(u => {
      const r = u.roles || (u.role ? [u.role] : []);
      return r.includes('admin') || r.includes('vendedor');
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  React.useEffect(() => {
    onFilteredRowsChange(table.getFilteredRowModel().rows.length);
  }, [table.getFilteredRowModel().rows, onFilteredRowsChange]);

  const dateColumn = table.getAllColumns().find(c => c.id === 'updatedAt' || c.id === 'createdAt');

  const handleApplyCustomRange = () => {
    const {day: fromDay, month: fromMonth, year: fromYear} = fromDate;
    const {day: toDay, month: toMonth, year: toYear} = toDate;

    if(fromDay && fromMonth && fromYear && toDay && toMonth && toYear) {
      const from = startOfDay(new Date(parseInt(fromYear), parseInt(fromMonth), parseInt(fromDay)));
      const to = endOfDay(new Date(parseInt(toYear), parseInt(toMonth), parseInt(toDay)));
       dateColumn?.setFilterValue({ from, to });
    }
  }

  const handleDatePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
        let from: Date | undefined;
        let to: Date | undefined;
        const today = new Date();

        switch(preset) {
            case 'today':
                from = today;
                to = today;
                break;
            case 'this_week':
                from = startOfWeek(today, { weekStartsOn: 1 });
                to = endOfWeek(today, { weekStartsOn: 1 });
                break;
            case 'this_month':
                from = startOfMonth(today);
                to = endOfMonth(today);
                break;
            case 'this_year':
                from = startOfYear(today);
                to = endOfYear(today);
                break;
            default:
                from = undefined;
                to = undefined;
        }
        if (from && to) {
            dateColumn?.setFilterValue({ 
                from: startOfDay(from), 
                to: endOfDay(to)
            });
        } else {
             dateColumn?.setFilterValue(undefined);
        }
    } else {
        // Clear previous filter when switching to custom, let user apply it.
        dateColumn?.setFilterValue(undefined);
    }
  }

  const statusColumn = table.getAllColumns().find(c => c.id === 'status');
  const ownerColumn = table.getAllColumns().find(c => c.id === 'ownerId');

  const statusFilter = statusColumn?.getFilterValue() as string[] | undefined;
  const ownerFilter = ownerColumn?.getFilterValue() as string[] | undefined;

  const clearFilters = () => {
    setColumnFilters([]);
    setGlobalFilter('');
    setSelectedPreset('');
    setFromDate({ day: '', month: '', year: '' });
    setToDate({ day: '', month: '', year: '' });
    dateColumn?.setFilterValue(undefined);
  }
  
  const handleDownloadCSV = () => {
    const filteredRows = table.getFilteredRowModel().rows;
    if (!filteredRows.length || !settingsConfig) return;

    const exportColumns = entityName === 'instalaciones' 
        ? settingsConfig.projectCsvExportColumns 
        : settingsConfig.csvExportColumns;

    if (!exportColumns || exportColumns.length === 0) return;
    
    const headers = exportColumns.map(c => c.label);

    const csvRows = filteredRows.map((row: Row<TData>) => {
        const item = row.original as any;
        
        return exportColumns.map(col => {
            let value: any;

            if (col.id === 'ownerName' || col.id === 'ownerId') {
                value = users.find(u => u.id === item.ownerId)?.name || item.ownerId || '';
            } else if (col.id === 'driverName' || col.id === 'driverId') {
                value = users.find(u => u.id === item.driverId)?.name || item.driverId || '';
            } else if (col.id === 'installerIds') {
                const installers = item.installerIds as string[] | undefined;
                value = installers?.map(id => users.find(u => u.id === id)?.name || id).join(' | ') || '';
            } else {
                value = item[col.id as keyof typeof item];
            }
            
            if (value instanceof Timestamp) {
                value = format(value.toDate(), 'yyyy-MM-dd HH:mm:ss');
            } else if (value instanceof Date) {
                 value = format(value, 'yyyy-MM-dd HH:mm:ss');
            }

            const stringValue = value === null || value === undefined ? '' : String(value);
            // Sanitize the string for CSV:
            // 1. Escape double quotes by doubling them.
            // 2. Remove newline characters to ensure each record is on a single line.
            const sanitizedValue = stringValue.replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
            return `"${sanitizedValue}"`;
        }).join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_${entityName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const hasActiveFilters = globalFilter || columnFilters.length > 0;
  
  const getDateFilterButtonText = () => {
    if (!selectedPreset) return "Seleccionar rango de fechas";
    
    switch(selectedPreset) {
        case 'today': return "Hoy";
        case 'this_week': return "Esta semana";
        case 'this_month': return "Este mes";
        case 'this_year': return "Este año";
        case 'custom':
            const filterValue = dateColumn?.getFilterValue() as { from: Date, to: Date } | undefined;
            if (filterValue && filterValue.from && filterValue.to) {
                return `${format(filterValue.from, "dd/MM/yy")} - ${format(filterValue.to, "dd/MM/yy")}`;
            }
            return "Rango Personalizado";
        default:
            return "Seleccionar rango de fechas";
    }
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalFilteredRows = table.getFilteredRowModel().rows.length;
  const startRow = totalFilteredRows > 0 ? pageIndex * pageSize + 1 : 0;
  const endRow = totalFilteredRows > 0 ? Math.min((pageIndex + 1) * pageSize, totalFilteredRows) : 0;
  
  const filteredTickets = React.useMemo(
    () => table.getFilteredRowModel().rows.map(r => r.original as Ticket),
    [table.getFilteredRowModel().rows]
  );

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Metrics Dashboard */}
      {showMetrics && <HistoryMetrics tickets={filteredTickets} users={users} />}

      {/* Table Area */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center p-4 gap-2 flex-wrap">
          <Input
            placeholder="Buscar en todo el historial..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-9 max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-[220px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className='truncate'>{getDateFilterButtonText()}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Filtrar por fecha</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={selectedPreset} onValueChange={handleDatePresetChange}>
                  <DropdownMenuRadioItem onSelect={(e) => e.preventDefault()} value="today">Hoy</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem onSelect={(e) => e.preventDefault()} value="this_week">Esta semana</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem onSelect={(e) => e.preventDefault()} value="this_month">Este mes</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem onSelect={(e) => e.preventDefault()} value="this_year">Este año</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem onSelect={(e) => e.preventDefault()} value="custom">Personalizado</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              {selectedPreset === 'custom' && (
                <>
                  <DropdownMenuSeparator />
                  <div onSelect={(e) => e.preventDefault()}>
                      <CustomDateSelector label='Desde' dateValue={fromDate} onDateChange={(part, val) => setFromDate(p => ({...p, [part]: val}))} />
                      <CustomDateSelector label='Hasta' dateValue={toDate} onDateChange={(part, val) => setToDate(p => ({...p, [part]: val}))} />
                      <div className="p-2">
                          <Button className="w-full" onClick={handleApplyCustomRange}>Aplicar Rango</Button>
                      </div>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {showStatusFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className='relative'>
                  <ListFilter className="mr-2 h-4 w-4" /> Estatus
                  {statusFilter && statusFilter.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{statusFilter.length}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por estatus</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(() => {
                  const availableStatuses = entityName === 'instalaciones' ? ProjectStatuses : TicketStatuses;
                  return (availableStatuses as string[]).map((status) => {
                    const isChecked = statusFilter?.includes(status) ?? false;
                    return (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={isChecked}
                        onCheckedChange={(value) => {
                          const current = statusFilter || [];
                          const newFilter = value ? [...current, status] : current.filter(s => s !== status);
                          statusColumn?.setFilterValue(newFilter.length ? newFilter : undefined);
                        }}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    );
                  });
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showOwnerFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className='relative'>
                  <ListFilter className="mr-2 h-4 w-4" /> Vendedor
                  {ownerFilter && ownerFilter.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{ownerFilter.length}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por vendedor</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {vendors.map((vendor) => {
                  const isChecked = ownerFilter?.includes(vendor.id) ?? false;
                  return (
                    <DropdownMenuCheckboxItem
                      key={vendor.id}
                      className="capitalize"
                      checked={isChecked}
                      onCheckedChange={(value) => {
                        const current = ownerFilter || [];
                        const newFilter = value ? [...current, vendor.id] : current.filter(id => id !== vendor.id);
                        ownerColumn?.setFilterValue(newFilter.length ? newFilter : undefined);
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {vendor.name}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Limpiar</Button>}
          
          <div className="flex-grow" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleDownloadCSV}>
                  <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Descargar CSV</p>
            </TooltipContent>
          </Tooltip>
      </div>
      <div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : (
                            <div
                              className={cn('flex items-center', header.column.getCanSort() ? 'cursor-pointer select-none' : '')}
                              onClick={header.column.getToggleSortingHandler()}
                               title={
                                header.column.getCanSort()
                                  ? header.column.getIsSorted() === 'desc'
                                    ? 'Sort ascending'
                                    : 'Sort descending'
                                  : undefined
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <span className="ml-2">
                                {{
                                  asc: <ArrowUp className="h-4 w-4" />,
                                  desc: <ArrowDown className="h-4 w-4" />,
                                }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="h-4 w-4 opacity-30" />}
                                </span>
                              )}
                            </div>
                          )
                      }
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <div className="flex items-center justify-between p-4">
        <div className="text-sm text-muted-foreground">
          {totalFilteredRows > 0
            ? `Mostrando ${startRow} - ${endRow} de ${totalFilteredRows} resultados.`
            : 'No se encontraron resultados.'}
        </div>
        <div className="flex items-center space-x-2">
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            >
            Anterior
            </Button>
            <div className="text-sm font-medium">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </div>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            >
            Siguiente
            </Button>
        </div>
      </div>
    </div>
    </div>
    </TooltipProvider>
  );
}
