'use client';

import { FocusedView } from "@/components/driver/focused-view";

export default function DriverPage() {
  return (
    // Removed container and max-width to allow full width on mobile
    <div className="p-2 md:container md:mx-auto md:p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
         <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Mi Ruta</h1>
            <p className="text-muted-foreground">Tus entregas para el dia de hoy.</p>
         </div>
         <FocusedView />
      </div>
    </div>
  );
}
