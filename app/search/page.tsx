'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, LocateFixed, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PharmacyMap } from '@/components/search/PharmacyMap';
import { PharmacyResultCard } from '@/components/search/PharmacyResultCard';
import { FiltersPanel } from '@/components/search/FiltersPanel';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { createClient } from '@/lib/supabase/client';
import type { CategoryRow, NearbyPharmacyResult } from '@/types/database.types';

const YAOUNDE_CENTER = { lat: 3.8480, lng: 11.5021 };

export default function SearchPage() {
  const supabase = createClient();
  const { coords, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 450);
  const [radius, setRadius] = useState(10000);
  const [sort, setSort] = useState<'distance' | 'price'>('distance');
  const [results, setResults] = useState<NearbyPharmacyResult[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [consentAsked, setConsentAsked] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    if (!consentAsked) {
      requestLocation();
      setConsentAsked(true);
    }
  }, [consentAsked, requestLocation]);

  const center = coords || YAOUNDE_CENTER;

  useEffect(() => {
    setLoading(true);
    supabase
      .rpc('nearby_pharmacies', {
        user_lat: center.lat,
        user_lng: center.lng,
        radius_meters: radius,
        medication_query: debouncedQuery || null,
      })
      .then(({ data, error }) => {
        if (!error && data) setResults(data as NearbyPharmacyResult[]);
        setLoading(false);
      });
  }, [center.lat, center.lng, radius, debouncedQuery]);

  const sortedResults = useMemo(() => {
    const copy = [...results];
    if (sort === 'price') {
      copy.sort((a, b) => (a.matching_price ?? Infinity) - (b.matching_price ?? Infinity));
    } else {
      copy.sort((a, b) => a.distance_meters - b.distance_meters);
    }
    return copy;
  }, [results, sort]);

  return (
    <>
      <Navbar />
      <main className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b border-ink-100 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a medication, e.g. Paracetamol 500mg"
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <FiltersPanel categories={categories} radius={radius} onRadiusChange={setRadius} sort={sort} onSortChange={setSort} />
              <Button variant="secondary" onClick={requestLocation} loading={geoLoading}>
                <LocateFixed className="h-4 w-4" /> Use my location
              </Button>
            </div>
          </div>
          {geoError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" /> {geoError} Showing results around central Yaoundé instead.
            </p>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-full max-w-md overflow-y-auto border-r border-ink-100 bg-ink-50/40 p-4 sm:p-5">
            {loading ? (
              <div className="grid h-40 place-items-center"><Spinner /></div>
            ) : sortedResults.length === 0 ? (
              <p className="mt-10 text-center text-sm text-ink-500">
                No pharmacies found {query && `with "${query}"`} in this radius. Try widening your search.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-ink-500">{sortedResults.length} pharmacy(ies) found</p>
                {sortedResults.map((p) => (
                  <PharmacyResultCard key={p.pharmacy_id} pharmacy={p} selected={hovered === p.pharmacy_id} onHover={setHovered} />
                ))}
              </div>
            )}
          </div>

          <div className="hidden flex-1 lg:block">
            <PharmacyMap center={center} pharmacies={sortedResults} selectedId={hovered} onSelect={setHovered} />
          </div>
        </div>
      </main>
    </>
  );
}
