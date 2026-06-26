'use client';

import Link from 'next/link';
import { MapPin, Clock, Star } from 'lucide-react';
import { cn, formatDistance, formatXAF, isPharmacyOpenNow } from '@/lib/utils';
import type { NearbyPharmacyResult } from '@/types/database.types';

export function PharmacyResultCard({ pharmacy, selected, onHover }: {
  pharmacy: NearbyPharmacyResult;
  selected?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const open = isPharmacyOpenNow(pharmacy.opening_hours, pharmacy.is_24h);

  return (
    <div
      onMouseEnter={() => onHover?.(pharmacy.pharmacy_id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn('card p-4 transition-all', selected && 'border-brand-400 ring-2 ring-brand-100')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-ink-900">{pharmacy.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
            <MapPin className="h-3.5 w-3.5" /> {pharmacy.address} · {formatDistance(pharmacy.distance_meters)}
          </p>
        </div>
        {pharmacy.average_rating > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {pharmacy.average_rating}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={cn('flex items-center gap-1 font-medium', open ? 'text-brand-600' : 'text-ink-400')}>
          <Clock className="h-3.5 w-3.5" /> {open ? 'Open now' : 'Closed'}
        </span>
      </div>

      {pharmacy.matching_medication_name && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-ink-900">{pharmacy.matching_medication_name}</p>
            <p className="text-xs text-ink-500">{pharmacy.matching_quantity} units in stock</p>
          </div>
          <span className="text-sm font-bold text-brand-700">{formatXAF(pharmacy.matching_price || 0)}</span>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link href={`/pharmacy/${pharmacy.pharmacy_id}`} className="btn-secondary flex-1 text-center">View pharmacy</Link>
        {pharmacy.matching_medication_id && (
          <Link href={`/reserve/${pharmacy.pharmacy_id}/${pharmacy.matching_medication_id}`} className="btn-primary flex-1 text-center">Reserve</Link>
        )}
      </div>
    </div>
  );
}
