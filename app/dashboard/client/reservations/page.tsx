import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { formatXAF, formatDate } from '@/lib/utils';
import { CancelReservationButton } from '@/components/dashboard/client/CancelReservationButton';
import Link from 'next/link';

export default async function ClientReservationsPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: client } = await supabase.from('clients').select('client_id').eq('user_id', auth.user!.id).single();

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, pharmacy:pharmacy_id(name, address, phone), medication:medication_id(name)')
    .eq('client_id', client!.client_id)
    .order('created_at', { ascending: false });

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-5 py-3">Medication</th>
            <th className="px-5 py-3">Pharmacy</th>
            <th className="px-5 py-3">Total</th>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {(reservations || []).map((r: any) => (
            <tr key={r.reservation_id}>
              <td className="px-5 py-3 font-medium text-ink-900">{r.medication.name} × {r.quantity}</td>
              <td className="px-5 py-3 text-ink-600">{r.pharmacy.name}</td>
              <td className="px-5 py-3 text-ink-600">{formatXAF(r.total_amount)}</td>
              <td className="px-5 py-3 text-ink-500">{formatDate(r.created_at)}</td>
              <td className="px-5 py-3"><Badge status={r.status} /></td>
              <td className="px-5 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/reservation/${r.reservation_id}`} className="text-xs font-semibold text-brand-600 hover:underline">Details</Link>
                  {['created', 'pending'].includes(r.status) && (
                    <CancelReservationButton reservationId={r.reservation_id} />
                  )}
                </div>
              </td>
            </tr>
          ))}
          {(reservations || []).length === 0 && (
            <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-500">No reservations yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
