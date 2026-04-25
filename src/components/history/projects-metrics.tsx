'use client';

import { useMemo } from 'react';
import { Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hammer, CheckCircle2, Clock, CalendarDays, BarChart3 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { differenceInDays, format, fromUnixTime } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { PROJECT_STATUS_STYLING } from '@/lib/project-styling-utils';

interface ProjectsMetricsProps {
  projects: Project[];
}

export function ProjectsMetrics({ projects }: ProjectsMetricsProps) {
  const metrics = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'Completado');
    const completionRate = total > 0 ? (completed.length / total) * 100 : 0;

    let onTimeCount = 0;
    let totalDays = 0;
    let validDurationCount = 0;

    // Monthly data for Bar Chart
    const monthlyDataMap: Record<string, number> = {};
    
    // Status distribution for Pie Chart
    const statusDataMap: Record<string, number> = {
      'Pendiente': 0,
      'En Progreso': 0,
      'Completado': 0,
      'Cancelado': 0
    };

    projects.forEach(p => {
      // Status Distribution
      if (statusDataMap[p.status] !== undefined) {
          statusDataMap[p.status]++;
      }

      if (p.status === 'Completado' && p.completedAt && p.startDate) {
        // Calculate Punctuality
        // completedAt <= endDate means on time. If endDate is not there, we compare with startDate (isOneDay case)
        const targetDate = p.endDate || p.startDate;
        let cDate: Date, tDate: Date, sDate: Date;
        
        if (p.completedAt instanceof Timestamp) cDate = p.completedAt.toDate();
        else cDate = new Date(p.completedAt as string);
        
        if (targetDate instanceof Timestamp) tDate = targetDate.toDate();
        else tDate = new Date(targetDate as string);

        if (p.startDate instanceof Timestamp) sDate = p.startDate.toDate();
        else sDate = new Date(p.startDate as string);

        // Strip time for fair comparison
        cDate.setHours(0,0,0,0);
        tDate.setHours(0,0,0,0);
        sDate.setHours(0,0,0,0);

        if (cDate <= tDate) {
          onTimeCount++;
        }

        // Calculate Duration
        const days = differenceInDays(cDate, sDate);
        if (days >= 0) {
            // Include same day as 1 day of work for metric purposes
            totalDays += (days === 0 ? 1 : days);
            validDurationCount++;
        }

        // Monthly completions
        const monthKey = format(cDate, 'MMM yyyy', { locale: es });
        monthlyDataMap[monthKey] = (monthlyDataMap[monthKey] || 0) + 1;
      }
    });

    const punctualityRate = completed.length > 0 ? (onTimeCount / completed.length) * 100 : 0;
    const avgDuration = validDurationCount > 0 ? (totalDays / validDurationCount) : 0;

    const monthlyData = Object.entries(monthlyDataMap).map(([name, Completados]) => ({ name, Completados }));
    
    const statusData = Object.entries(statusDataMap)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({ 
            name, 
            value,
            color: PROJECT_STATUS_STYLING[name as keyof typeof PROJECT_STATUS_STYLING]?.badge || 'gray-500' // Pass the entire badge string to extract color
        }));

    return {
      total,
      completionRate,
      punctualityRate,
      avgDuration,
      monthlyData,
      statusData
    };
  }, [projects]);

  // Map tailwind classes to hex for Recharts
  const getColorHex = (colorClass: string) => {
      if (colorClass.includes('sky')) return '#0ea5e9';
      if (colorClass.includes('indigo')) return '#6366f1';
      if (colorClass.includes('emerald') || colorClass.includes('green')) return '#10b981';
      if (colorClass.includes('red')) return '#ef4444';
      if (colorClass.includes('slate')) return '#64748b';
      return '#cbd5e1';
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntualidad</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.punctualityRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Entregados en fecha acordada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
            <CalendarDays className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgDuration.toFixed(1)} <span className="text-lg">días</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Proyectos Completados por Mes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {metrics.monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                            <Bar dataKey="Completados" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No hay suficientes datos completados
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-medium">Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {metrics.statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {metrics.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No hay datos
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
