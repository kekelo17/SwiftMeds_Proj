import { ClipboardList, Clock, CheckCircle2, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/Badge';
import { formatXAF, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function ClientOverviewPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: client } = await supabase.from('clients').select('client_id, is_premium').eq('user_id', auth.user!.id).single();

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, pharmacy:pharmacy_id(name), medication:medication_id(name)')
    .eq('client_id', client!.client_id)
    .order('created_at', { ascending: false })
    .limit(5);

  const total = reservations?.length || 0;
  const pending = reservations?.filter((r) => r.status === 'pending').length || 0;
  const collected = reservations?.filter((r) => r.status === 'collected').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="Total reservations" value={total} />
        <StatCard icon={Clock} label="Awaiting pickup" value={pending} accent="amber" />
        <StatCard icon={CheckCircle2} label="Collected" value={collected} />
      </div>

      {client?.is_premium && (
        <div className="card flex items-center gap-3 border-brand-200 bg-brand-50 p-4">
          <Star className="h-5 w-5 fill-brand-600 text-brand-600" />
          <p className="text-sm font-medium text-brand-800">You're a Swift Meds Premium member — priority reservations &amp; perks unlocked.</p>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink-900">Recent reservations</h2>
          <Link href="/dashboard/client/reservations" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="mt-4 divide-y divide-ink-100">
          {(reservations || []).length === 0 && <p className="py-6 text-center text-sm text-ink-500">No reservations yet. <Link href="/search" className="text-brand-600 hover:underline">Find medication</Link></p>}
          {(reservations || []).map((r: any) => (
            <div key={r.reservation_id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink-900">{r.medication.name} × {r.quantity}</p>
                <p className="text-xs text-ink-500">{r.pharmacy.name} · {formatDate(r.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-ink-900">{formatXAF(r.total_amount)}</span>
                <Badge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
