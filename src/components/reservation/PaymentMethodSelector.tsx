'use client';

import { cn } from '@/lib/utils';

const METHODS = [
  { id: 'mtn_momo', label: 'MTN Mobile Money', color: 'border-amber-400 bg-amber-50 text-amber-700' },
  { id: 'orange_money', label: 'Orange Money', color: 'border-orange-400 bg-orange-50 text-orange-700' },
] as const;

export function PaymentMethodSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {METHODS.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={cn(
            'rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all',
            value === m.id ? m.color : 'border-ink-100 text-ink-500 hover:border-ink-200'
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
