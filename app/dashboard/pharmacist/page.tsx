import { ClipboardList, Clock, Package, Banknote } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/Badge';
import { formatXAF, formatDate } from '@/lib/utils';

export default async function PharmacistOverviewPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: pharmacist } = await supabase.from('pharmacists').select('pharmacy_id').eq('user_id', auth.user!.id).single();
  const pharmacyId = pharmacist?.pharmacy_id;

  const { data: stats } = await supabase.rpc('pharmacy_stats', { p_pharmacy_id: pharmacyId });

  const { data: recent } = await supabase
    .from('reservations')
    .select('*, medication:medication_id(name)')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .limit(6);

  const s = (stats as any) || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total reservations" value={s.total_reservations ?? 0} />
        <StatCard icon={Clock} label="Pending" value={s.pending_reservations ?? 0} accent="amber" />
        <StatCard icon={Package} label="Low stock items" value={s.low_stock_items ?? 0} accent="red" />
        <StatCard icon={Banknote} label="Revenue (XAF)" value={formatXAF(s.revenue_xaf ?? 0)} />
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-ink-900">Recent reservations</h2>
        <div className="mt-4 divide-y divide-ink-100">
          {(recent || []).length === 0 && <p className="py-6 text-center text-sm text-ink-500">No reservations yet.</p>}
          {(recent || []).map((r: any) => (
            <div key={r.reservation_id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink-900">{r.medication.name} × {r.quantity}</p>
                <p className="text-xs text-ink-500">{formatDate(r.created_at)}</p>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
