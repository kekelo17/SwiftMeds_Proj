import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, accent }: {
  icon: LucideIcon; label: string; value: string | number; accent?: 'brand' | 'amber' | 'red';
}) {
  const colors = {
    brand: 'bg-brand-100 text-brand-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }[accent || 'brand'];

  return (
    <div className="card p-5">
      <div className={cn('grid h-10 w-10 place-items-center rounded-xl', colors)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 font-display text-2xl font-bold text-ink-950">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}
