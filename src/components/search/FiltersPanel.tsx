'use client';

import { Select } from '@/components/ui/Select';
import type { CategoryRow } from '@/types/database.types';

interface FiltersPanelProps {
  categories: CategoryRow[];
  radius: number;
  onRadiusChange: (r: number) => void;
  sort: 'distance' | 'price';
  onSortChange: (s: 'distance' | 'price') => void;
}

export function FiltersPanel({ radius, onRadiusChange, sort, onSortChange }: FiltersPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={radius} onChange={(e) => onRadiusChange(Number(e.target.value))} className="w-auto">
        <option value={2000}>Within 2 km</option>
        <option value={5000}>Within 5 km</option>
        <option value={10000}>Within 10 km</option>
        <option value={20000}>Within 20 km</option>
      </Select>
      <Select value={sort} onChange={(e) => onSortChange(e.target.value as 'distance' | 'price')} className="w-auto">
        <option value="distance">Sort: Nearest first</option>
        <option value="price">Sort: Cheapest first</option>
      </Select>
    </div>
  );
}
