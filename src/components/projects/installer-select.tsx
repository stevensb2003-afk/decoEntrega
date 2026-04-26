'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@/lib/types';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface InstallerSelectProps {
  installers: User[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function InstallerSelect({ installers, value, onChange, error }: InstallerSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const remove = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  const selectedInstallers = installers.filter((u) => value.includes(u.id));

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className={cn(
          'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer',
          error && 'border-destructive focus:ring-destructive'
        )}
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selectedInstallers.length === 0 ? (
            <span className="text-muted-foreground">Seleccionar instaladores…</span>
          ) : (
            selectedInstallers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {u.name}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(u.id); }}
                  className="hover:text-destructive transition-colors"
                  aria-label={`Quitar ${u.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground ml-2" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
          {installers.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground text-center">
              No hay instaladores registrados
            </p>
          ) : (
            <ul className="max-h-48 overflow-auto p-1">
              {installers.map((u) => {
                const selected = value.includes(u.id);
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => toggle(u.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent transition-colors',
                        selected && 'bg-accent'
                      )}
                    >
                      <div className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary',
                        selected ? 'bg-primary text-primary-foreground' : 'bg-background'
                      )}>
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="flex-1 text-left">{u.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
