import { Users, Store, ClipboardList, Banknote, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatXAF } from '@/lib/utils';

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const { data: stats } = await supabase.rpc('admin_stats');
  const s = (stats as any) || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total users" value={s.total_users ?? 0} />
        <StatCard icon={Store} label="Approved pharmacies" value={s.approved_pharmacies ?? 0} />
        <StatCard icon={Clock} label="Pending pharmacy approvals" value={s.pending_pharmacies ?? 0} accent="amber" />
        <StatCard icon={ClipboardList} label="Total reservations" value={s.total_reservations ?? 0} />
        <StatCard icon={ClipboardList} label="Successful pickups" value={s.successful_reservations ?? 0} />
        <StatCard icon={Banknote} label="Total revenue (XAF)" value={formatXAF(s.total_revenue_xaf ?? 0)} />
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-ink-900">Platform health</h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          {s.pending_pharmacies > 0
            ? `${s.pending_pharmacies} pharmacy application(s) are awaiting DPML license verification.`
            : 'All pharmacy applications are processed.'}{' '}
          Review pending applications under <span className="font-medium text-brand-700">Pharmacies</span>.
        </p>
      </div>
    </div>
  );
}
