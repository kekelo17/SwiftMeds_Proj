'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { formatXAF, formatDate } from '@/lib/utils';
import type { ReservationStatus } from '@/types/database.types';

const NEXT_STATUS: Record<string, ReservationStatus | null> = {
  pending: 'confirmed',
  confirmed: 'ready',
  ready: 'collected',
  collected: null,
  cancelled: null,
  expired: null,
  created: 'pending',
};

const ACTION_LABEL: Record<string, string> = {
  pending: 'Confirm',
  confirmed: 'Mark ready',
  ready: 'Mark collected',
  created: 'Acknowledge',
};

export function ReservationsManager({ reservations }: { reservations: any[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const advance = async (reservationId: string, current: string) => {
    const next = NEXT_STATUS[current];
    if (!next) return;
    setBusyId(reservationId);
    const { error } = await supabase.from('reservations').update({ status: next }).eq('reservation_id', reservationId);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Reservation marked as ${next}`);
    router.refresh();
  };

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-5 py-3">Patient</th>
            <th className="px-5 py-3">Medication</th>
            <th className="px-5 py-3">Total</th>
            <th className="px-5 py-3">Pickup code</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {reservations.map((r) => (
            <tr key={r.reservation_id}>
              <td className="px-5 py-3">
                <p className="font-medium text-ink-900">{r.patient_name || r.client?.user?.full_name || 'Client'}</p>
                <p className="text-xs text-ink-500">{r.client?.user?.phone_number}</p>
              </td>
              <td className="px-5 py-3 text-ink-700">{r.medication.name} × {r.quantity}</td>
              <td className="px-5 py-3 text-ink-600">{formatXAF(r.total_amount)}</td>
              <td className="px-5 py-3 font-mono text-xs text-ink-600">{r.pickup_code || '—'}</td>
              <td className="px-5 py-3"><Badge status={r.status} /></td>
              <td className="px-5 py-3 text-right">
                {NEXT_STATUS[r.status] && (
                  <button
                    onClick={() => advance(r.reservation_id, r.status)}
                    disabled={busyId === r.reservation_id}
                    className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
                  >
                    {ACTION_LABEL[r.status] || 'Advance'}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {reservations.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-500">No reservations yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
