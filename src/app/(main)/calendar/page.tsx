'use client';

import { FullCalendar } from '@/components/calendar/full-calendar';

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Calendario</h1>
      </div>
      <FullCalendar />
    </div>
  );
}
