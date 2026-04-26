import { useState } from 'react';
import { Project } from '@/lib/types';
import { MapPin, ExternalLink, Navigation, Pencil, Check, X } from 'lucide-react';
import { LocationPicker } from '@/components/ui/location-picker';
import { Button } from '@/components/ui/button';

interface LocationInfoSectionProps {
  project: Project;
  canEdit: boolean;
  onUpdate: (update: Partial<Project>) => void;
}

export function LocationInfoSection({ project, canEdit, onUpdate }: LocationInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Use coordinates if available for more precise navigation
  const mapsUrl = project.locationLat && project.locationLng 
    ? `https://www.google.com/maps/search/?api=1&query=${project.locationLat},${project.locationLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.locationDetails || '')}`;

  const wazeUrl = project.locationLat && project.locationLng
    ? `https://waze.com/ul?ll=${project.locationLat},${project.locationLng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(project.locationDetails || '')}`;

  const [tempLocation, setTempLocation] = useState<{ addr: string; lat?: number; lng?: number } | null>(null);

  const handleSaveLocation = () => {
    if (tempLocation) {
      onUpdate({
        locationDetails: tempLocation.addr,
        locationLat: tempLocation.lat,
        locationLng: tempLocation.lng
      });
    }
    setIsEditing(false);
    setTempLocation(null);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ubicación
        </h3>
        {canEdit && !isEditing && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsEditing(true);
              setTempLocation({
                addr: project.locationDetails || '',
                lat: project.locationLat,
                lng: project.locationLng
              });
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <LocationPicker
                value={tempLocation?.addr || project.locationDetails}
                initialLat={tempLocation?.lat || project.locationLat}
                initialLng={tempLocation?.lng || project.locationLng}
                onChange={(_url, lat, lng, addr) => {
                  setTempLocation({ addr: addr || _url, lat, lng });
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs" 
                  onClick={() => {
                    setIsEditing(false);
                    setTempLocation(null);
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 text-xs bg-green-600 hover:bg-green-700" 
                  onClick={handleSaveLocation}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Guardar Ubicación
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium leading-relaxed">
              {project.locationDetails || 'Sin dirección definida'}
            </p>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="flex gap-2 pt-1">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors px-3 py-2 text-xs font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Google Maps
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors px-3 py-2 text-xs font-medium"
          >
            <Navigation className="h-3.5 w-3.5" />
            Waze
          </a>
        </div>
      )}

    </section>
  );
}
