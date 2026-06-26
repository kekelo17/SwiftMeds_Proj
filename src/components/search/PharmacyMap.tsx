'use client';

import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { NearbyPharmacyResult } from '@/types/database.types';
import { formatDistance, formatXAF } from '@/lib/utils';
import Link from 'next/link';

interface PharmacyMapProps {
  center: { lat: number; lng: number };
  pharmacies: NearbyPharmacyResult[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const containerStyle = { width: '100%', height: '100%' };

const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export function PharmacyMap({ center, pharmacies, selectedId, onSelect }: PharmacyMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    id: 'swift-meds-google-maps',
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!isLoaded) {
    return <div className="grid h-full w-full place-items-center bg-ink-50 text-sm text-ink-400">Loading map…</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
    >
      <MarkerF
        position={center}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#1fb267',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        }}
      />

      {pharmacies.map((p) => (
        <MarkerF
          key={p.pharmacy_id}
          position={{ lat: p.latitude, lng: p.longitude }}
          onClick={() => { setActiveId(p.pharmacy_id); onSelect?.(p.pharmacy_id); }}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
            fillColor: selectedId === p.pharmacy_id ? '#0f4c31' : '#1fb267',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 1.5,
            scale: 1.6,
            anchor: new google.maps.Point(12, 22),
          }}
        >
          {activeId === p.pharmacy_id && (
            <InfoWindowF position={{ lat: p.latitude, lng: p.longitude }} onCloseClick={() => setActiveId(null)}>
              <div className="w-56 p-3">
                <p className="font-semibold text-ink-900">{p.name}</p>
                <p className="flex items-center gap-1 text-xs text-ink-500"><MapPin className="h-3 w-3" /> {formatDistance(p.distance_meters)}</p>
                {p.matching_medication_name && (
                  <p className="mt-1 text-xs text-brand-700">{p.matching_medication_name} · {formatXAF(p.matching_price || 0)}</p>
                )}
                <Link href={`/pharmacy/${p.pharmacy_id}`} className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline">
                  View pharmacy →
                </Link>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
}
