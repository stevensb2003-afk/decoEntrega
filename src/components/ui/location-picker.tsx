'use client';

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { Input } from './input';
import { Skeleton } from './skeleton';
import { Button } from './button';
import { MapPin } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '250px'
};

const defaultCenter = {
  lat: 9.9281, // Costa Rica default center
  lng: -84.0907
};

interface LocationPickerProps {
    value?: string;
    onChange: (url: string, lat?: number, lng?: number, address?: string) => void;
    placeholder?: string;
    initialLat?: number;
    initialLng?: number;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

export function LocationPicker({ value, onChange, placeholder, initialLat, initialLng }: LocationPickerProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPos, setMarkerPos] = useState(initialLat && initialLng ? { lat: initialLat, lng: initialLng } : defaultCenter);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [addressText, setAddressText] = useState(value && !value.startsWith('http') ? value : '');
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        // Try to parse google maps URL if passed as value without lat/lng
        if (value && value.includes('query=') && (!initialLat || !initialLng)) {
            const match = value.match(/query=([-0-9.]+),([-0-9.]+)/);
            if (match) {
                setMarkerPos({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) });
            }
        }
    }, [value, initialLat, initialLng]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const updateLocation = (lat: number, lng: number, addr: string) => {
        setMarkerPos({ lat, lng });
        setAddressText(addr);
        map?.panTo({ lat, lng });
        if (map && map.getZoom()! < 16) {
             map.setZoom(16);
        }
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        onChange(url, lat, lng, addr);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const addr = place.formatted_address || place.name || '';
                updateLocation(lat, lng, addr);
            }
        }
    };

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            // Reverse geocode to get address
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                let addr = '';
                if (status === 'OK' && results && results[0]) {
                    addr = results[0].formatted_address;
                }
                updateLocation(lat, lng, addr);
            });
        }
    };

    if (!isLoaded) return <Skeleton className="w-full h-[300px] rounded-md" />;

    return (
        <div className="space-y-3 p-1">
            <div className="flex gap-2">
                <div className="flex-1">
                    <Autocomplete
                        onLoad={setAutocomplete}
                        onPlaceChanged={onPlaceChanged}
                        options={{ componentRestrictions: { country: 'cr' } }}
                    >
                        <Input 
                            type="text" 
                            placeholder={placeholder || "Buscar ubicación por dirección..."} 
                            value={addressText}
                            onChange={(e) => {
                                setAddressText(e.target.value);
                                // Make sure to still sync text-only inputs if they don't select from map
                                // Only pass url, lat, lng. Don't pass the search text as the confirmed address.
                                onChange(e.target.value, markerPos.lat, markerPos.lng);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault(); // Prevent form submission
                                }
                            }}
                        />
                    </Autocomplete>
                </div>
                <Button 
                    type="button" 
                    variant={showMap ? "default" : "outline"} 
                    className="flex-shrink-0"
                    onClick={() => setShowMap(!showMap)}
                    title="Ajustar exacto en el mapa"
                >
                    <MapPin className="h-4 w-4" />
                </Button>
            </div>
            
            {showMap && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border rounded-md overflow-hidden shadow-sm">
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={markerPos}
                            zoom={initialLat && initialLng ? 16 : 12}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            onClick={onMapClick}
                            options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: true }}
                        >
                            <Marker 
                                position={markerPos} 
                                draggable={true} 
                                onDragEnd={onMapClick} 
                            />
                        </GoogleMap>
                    </div>
                </div>
            )}
        </div>
    );
}
