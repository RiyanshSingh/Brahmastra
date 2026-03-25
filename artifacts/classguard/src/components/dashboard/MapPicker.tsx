import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Target } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icon in React-Leaflet
const customIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div className="absolute w-8 h-8 bg-primary/20 rounded-full animate-ping" />
      <div className="relative bg-primary text-white p-1.5 rounded-full shadow-lg border-2 border-border/40">
        <MapPin className="w-4 h-4" />
      </div>
    </div>
  ),
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, radius, onChange }: MapPickerProps) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  return lat && lng ? (
    <>
      <Marker position={[lat, lng]} icon={customIcon} />
      <Circle 
        center={[lat, lng]} 
        radius={radius} 
        pathOptions={{ 
            fillColor: 'var(--color-primary)', 
            fillOpacity: 0.1, 
            color: 'var(--color-primary)', 
            weight: 1,
            dashArray: '5, 5'
        }} 
      />
    </>
  ) : null;
}

export function MapPicker({ lat, lng, radius, onChange }: MapPickerProps) {
  const initialPos: [number, number] = lat && lng ? [lat, lng] : [23.2599, 77.4126]; // Default to center of India/Bhopal or similar

  return (
    <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border border-border group">
      <MapContainer
        center={initialPos}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker lat={lat} lng={lng} radius={radius} onChange={onChange} />
        
        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                            onChange(pos.coords.latitude, pos.coords.longitude);
                        });
                    }
                }}
                className="p-2 rounded-xl bg-card/80 backdrop-blur-md border border-border text-primary shadow-lg hover:bg-card transition-colors"
                title="Use Current Location"
            >
                <Target className="w-5 h-5" />
            </button>
        </div>

        {/* Instructions Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-border text-[10px] font-bold text-white/70 uppercase tracking-widest pointer-events-none">
            Click map to set classroom center
        </div>
      </MapContainer>
    </div>
  );
}
