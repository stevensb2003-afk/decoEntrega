'use client';

import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InlineEditFieldProps {
  value: string;
  displayValue?: string;
  onSave: (newValue: string) => void;
  label?: string;
  type?: 'text' | 'number' | 'date' | 'tel' | 'textarea';
  canEdit?: boolean;
  className?: string;
  inputClassName?: string;
  prefix?: string;
}

export function InlineEditField({
  value,
  displayValue,
  onSave,
  label,
  type = 'text',
  canEdit = false,
  className,
  inputClassName,
  prefix,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSave = () => {
    if (inputValue !== value) {
      onSave(inputValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!canEdit) {
    return (
      <div className={cn("space-y-1", className)}>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
        <p className="font-medium text-sm">
          {prefix}{displayValue || value || '—'}
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={cn("space-y-1", className)}>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
        <div className="flex items-center gap-2">
          {type === 'textarea' ? (
             <textarea
                className={cn(
                  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  inputClassName
                )}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
             />
          ) : (
            <Input
              type={type}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn("h-8 text-sm", inputClassName)}
              autoFocus
            />
          )}
          <div className="flex flex-col gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "space-y-1 group cursor-pointer hover:bg-muted/50 p-1 -m-1 rounded-md transition-colors", 
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-sm">
          {prefix}{displayValue || value || '—'}
        </p>
        {!label && <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
    </div>
  );
}
