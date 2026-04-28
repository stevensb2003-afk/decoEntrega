'use client';

import { useState } from 'react';
import { ProjectNote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotesTimelineProps {
  notes: ProjectNote[];
  currentUserId: string;
  currentUserName: string;
  canEdit?: boolean;
  onAddNote: (note: ProjectNote) => void;
}

export function NotesTimeline({ notes, currentUserId, currentUserName, canEdit = true, onAddNote }: NotesTimelineProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text) return;
    setSubmitting(true);
    onAddNote({
      id: crypto.randomUUID(),
      content: text,
      createdBy: currentUserId,
      createdByName: currentUserName,
      createdAt: new Date().toISOString(),
    });
    setContent('');
    setSubmitting(false);
  };

  const formatDate = (dateStr: string | any) => {
    try {
      const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr?.seconds * 1000);
      return format(d, "d 'de' MMM, HH:mm", { locale: es });
    } catch {
      return '';
    }
  };

  const sorted = [...notes].sort((a, b) => {
    const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : ((a.createdAt as any)?.seconds ?? 0) * 1000;
    const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : ((b.createdAt as any)?.seconds ?? 0) * 1000;
    return bTime - aTime; // newest first
  });

  return (
    <div className="space-y-5">
      {/* Input */}
      {canEdit && (
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe una nota o comentario sobre el proyecto…"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ctrl+Enter para enviar</p>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Publicar nota
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
          <MessageSquare className="h-10 w-10 opacity-20" />
          <p className="text-sm">Sin notas todavía</p>
        </div>
      ) : (
        <ul className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" aria-hidden />

          {sorted.map((note, i) => (
            <li key={note.id} className="relative pl-9 pb-6 last:pb-0">
              {/* Dot */}
              <span className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full border-2 border-background bg-primary/70 ring-2 ring-primary/20" />

              <div className="rounded-lg border border-border bg-card p-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-foreground">
                    {note.createdByName || 'Usuario'}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
