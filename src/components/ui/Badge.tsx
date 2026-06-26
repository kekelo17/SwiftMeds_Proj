import { cn } from '@/lib/utils';

const VARIANT_STYLES: Record<string, string> = {
  created: 'bg-ink-100 text-ink-600',
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  ready: 'bg-brand-100 text-brand-700',
  collected: 'bg-brand-600 text-white',
  expired: 'bg-ink-200 text-ink-600',
  cancelled: 'bg-red-100 text-red-700',
  approved: 'bg-brand-100 text-brand-700',
  suspended: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  deleted: 'bg-ink-200 text-ink-600',
  successful: 'bg-brand-100 text-brand-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-blue-100 text-blue-700',
};

export function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('badge', VARIANT_STYLES[status] || 'bg-ink-100 text-ink-600', className)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
