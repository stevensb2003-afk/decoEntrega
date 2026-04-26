'use client';

import { useMemo, useState } from 'react';
import { Project, ProjectStatuses, User } from '@/lib/types';
import { ProjectCard } from './project-card';
import { ClipboardList, Filter, Search, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ProjectListProps {
  projects: Project[];
  users: User[];
  installers: User[];
}

const ALL_STATUSES = 'todos';
const ALL_INSTALLERS = 'todos';

export function ProjectList({ projects, users, installers }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [installerFilter, setInstallerFilter] = useState<string>(ALL_INSTALLERS);
  const [currentTab, setCurrentTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== ALL_STATUSES ||
    installerFilter !== ALL_INSTALLERS;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesTab = 
        currentTab === 'active' ? (p.status === 'Pendiente' || p.status === 'En Progreso') :
        currentTab === 'completed' ? p.status === 'Completado' :
        p.status === 'Cancelado';

      const matchesSearch =
        q === '' ||
        p.projectId?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q);
      
      const matchesStatus =
        statusFilter === ALL_STATUSES || p.status === statusFilter;
      
      const matchesInstaller =
        installerFilter === ALL_INSTALLERS ||
        p.installerIds?.includes(installerFilter);
        
      return matchesTab && matchesSearch && matchesStatus && matchesInstaller;
    });
  }, [projects, searchQuery, statusFilter, installerFilter, currentTab]);

  const clearAll = () => {
    setSearchQuery('');
    setStatusFilter(ALL_STATUSES);
    setInstallerFilter(ALL_INSTALLERS);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <Tabs 
        value={currentTab} 
        onValueChange={(val) => {
          setCurrentTab(val as any);
          setStatusFilter(ALL_STATUSES);
        }} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="w-4 h-4" />
            <span className="truncate">Activos</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="truncate">Completados</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-1.5 sm:gap-2">
            <XCircle className="w-4 h-4" />
            <span className="truncate">Cancelados</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar por ID, nombre de proyecto o cliente…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap rounded-lg border border-border bg-card px-4 py-3">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

        {currentTab === 'active' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>Todos los activos</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="En Progreso">En Progreso</SelectItem>
            </SelectContent>
          </Select>
        )}

        {installers.length > 0 && (
          <Select value={installerFilter} onValueChange={setInstallerFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs">
              <SelectValue placeholder="Instalador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_INSTALLERS}>Todos los instaladores</SelectItem>
              {installers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 px-2 text-xs text-muted-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpiar todo
          </Button>
        )}

        <span
          className={cn(
            'ml-auto text-xs text-muted-foreground shrink-0',
            hasActiveFilters && 'text-primary font-medium'
          )}
        >
          {filtered.length}{' '}
          {filtered.length === 1 ? 'proyecto' : 'proyectos'}
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
          <ClipboardList className="h-12 w-12 opacity-30" />
          <p className="text-sm font-medium">
            {hasActiveFilters
              ? 'No se encontraron proyectos'
              : 'No hay proyectos todavía'}
          </p>
          {hasActiveFilters && (
            <Button variant="link" size="sm" onClick={clearAll}>
              Limpiar búsqueda y filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((project, index) => (
            <div 
              key={project.id} 
              className="animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProjectCard
                project={project}
                installers={users}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
