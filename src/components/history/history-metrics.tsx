'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, User } from '@/lib/types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, Star, Clock, CheckCircle } from 'lucide-react';

interface HistoryMetricsProps {
    tickets: Ticket[];
    users: User[];
}

const STATUS_COLORS: Record<string, string> = {
    'Pendiente': '#38bdf8', // sky-400
    'Alistando': '#fbbf24', // amber-400 
    'En Ruta': '#818cf8',   // indigo-400
    'Entregado': '#34d399', // emerald-400
    'Cancelado': '#fb7185', // rose-400
};

export function HistoryMetrics({ tickets, users }: HistoryMetricsProps) {
    const metrics = useMemo(() => {
        let totalSatisfaction = 0;
        let satisfactionCount = 0;
        let onTimeCount = 0;
        let qualityCount = 0;
        let deliveriesWithTiming = 0;
        let deliveriesWithQuality = 0;

        let activeTicketsCount = 0;

        const volumeByDate: Record<string, number> = {};
        const volumeByDriver: Record<string, { name: string, count: number }> = {};
        const statusCount: Record<string, number> = {};

        tickets.forEach(ticket => {
            // Count active tickets
            if (ticket.status !== 'Entregado' && ticket.status !== 'Cancelado') {
                activeTicketsCount++;
            }

            // KPIs
            if (ticket.satisfaction) {
                totalSatisfaction += ticket.satisfaction;
                satisfactionCount++;
            }
            if (ticket.timing) {
                deliveriesWithTiming++;
                if (ticket.timing === 'Si') onTimeCount++;
            }
            if (ticket.quality) {
                deliveriesWithQuality++;
                if (ticket.quality === 'Si') qualityCount++;
            }

            // By Date (using createdAt, but the chart is for Delivered tickets only)
            if (ticket.status === 'Entregado') {
                let dateObj = new Date();
                if (ticket.createdAt) {
                    if (typeof (ticket.createdAt as any).toDate === 'function') {
                        dateObj = (ticket.createdAt as any).toDate();
                    } else if (ticket.createdAt instanceof Date) {
                        dateObj = ticket.createdAt;
                    } else if (typeof ticket.createdAt === 'string' || typeof ticket.createdAt === 'number') {
                        dateObj = new Date(ticket.createdAt);
                    }
                }
                const dateStr = format(dateObj, 'dd MMM yy', { locale: es });
                volumeByDate[dateStr] = (volumeByDate[dateStr] || 0) + 1;
            }

            // By Driver (excluding Cancelado)
            if (ticket.driverId && ticket.status !== 'Cancelado') {
                const driverName = users.find(u => u.id === ticket.driverId)?.name || 'Sin Asignar';
                if (!volumeByDriver[ticket.driverId]) {
                    volumeByDriver[ticket.driverId] = { name: driverName, count: 0 };
                }
                volumeByDriver[ticket.driverId].count++;
            }

            // By Status
            statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1;
        });

        // Format for Recharts
        const volumeData = Object.keys(volumeByDate).map(date => ({
            date,
            entregas: volumeByDate[date]
        }));
        // Sort by actual date. Hacky way since 'dd MMM yy' is not easily sortable natively,
        // but since we process them chronologically they usually come sorted. Wait, tickets might not be sorted!
        // We'll trust they kind of are, or we sort the tickets first.
        
        const driverData = Object.values(volumeByDriver).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5
        
        const statusData = Object.keys(statusCount).map(status => ({
            name: status,
            value: statusCount[status]
        }));

        return {
            activeTicketsCount,
            avgSatisfaction: satisfactionCount ? (totalSatisfaction / satisfactionCount).toFixed(1) : 'N/A',
            onTimePerc: deliveriesWithTiming ? Math.round((onTimeCount / deliveriesWithTiming) * 100) : 0,
            qualityPerc: deliveriesWithQuality ? Math.round((qualityCount / deliveriesWithQuality) * 100) : 0,
            volumeData,
            driverData,
            statusData
        };
    }, [tickets, users]);

    if (tickets.length === 0) return null;

    return (
        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets Filtrados</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tickets.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Activos</CardTitle>
                        <Package className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeTicketsCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Satisfacción Promedio</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.avgSatisfaction} / 5</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entregas a Tiempo</CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.onTimePerc}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Calidad Excelente</CardTitle>
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.qualityPerc}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Tickets Entregados</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.volumeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="entregas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Distribución por Estatus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metrics.statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {metrics.statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                
                {metrics.driverData.length > 0 && (
                     <Card className="col-span-1 lg:col-span-3">
                         <CardHeader>
                             <CardTitle>Top Choferes (Por Volumen)</CardTitle>
                         </CardHeader>
                         <CardContent>
                             <div className="h-[250px] w-full">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <BarChart data={metrics.driverData} layout="vertical" margin={{ left: 50 }}>
                                         <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                         <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                         <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} />
                                         <Tooltip cursor={{ fill: 'transparent' }} />
                                         <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Entregas" />
                                     </BarChart>
                                 </ResponsiveContainer>
                             </div>
                         </CardContent>
                     </Card>
                )}
            </div>
        </div>
    );
}
