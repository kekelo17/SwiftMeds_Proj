'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export function PharmacyApprovalTable({ pharmacies }: { pharmacies: any[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const updateStatus = async (pharmacyId: string, status: string, userId?: string) => {
    setBusyId(pharmacyId);
    const { error } = await supabase
      .from('pharmacies')
      .update({ status, is_approved: status === 'approved' })
      .eq('pharmacy_id', pharmacyId);
    setBusyId(null);
    if (error) return toast.error(error.message);

    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Pharmacy status updated',
        message: `Your pharmacy has been ${status}.`,
        notification_type: 'pharmacy_approval',
      });
    }

    toast.success(`Pharmacy ${status}`);
    router.refresh();
  };

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-5 py-3">Pharmacy</th>
            <th className="px-5 py-3">Pharmacist</th>
            <th className="px-5 py-3">License #</th>
            <th className="px-5 py-3">Submitted</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {pharmacies.map((p) => {
            const pharmacist = p.pharmacists?.[0];
            const userId = pharmacist?.user?.user_id;
            return (
              <tr key={p.pharmacy_id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-ink-900">{p.name}</p>
                  <p className="text-xs text-ink-500">{p.address}</p>
                </td>
                <td className="px-5 py-3 text-ink-600">
                  {pharmacist?.user?.full_name}<br />
                  <span className="text-xs text-ink-400">{pharmacist?.user?.email}</span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-ink-600">{p.license_number}</td>
                <td className="px-5 py-3 text-ink-500">{formatDate(p.created_at)}</td>
                <td className="px-5 py-3"><Badge status={p.status} /></td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-3 text-xs font-semibold">
                    {p.status !== 'approved' && (
                      <button disabled={busyId === p.pharmacy_id} onClick={() => updateStatus(p.pharmacy_id, 'approved', userId)} className="text-brand-600 hover:underline disabled:opacity-50">Approve</button>
                    )}
                    {p.status === 'approved' && (
                      <button disabled={busyId === p.pharmacy_id} onClick={() => updateStatus(p.pharmacy_id, 'suspended', userId)} className="text-amber-600 hover:underline disabled:opacity-50">Suspend</button>
                    )}
                    {p.status !== 'rejected' && p.status !== 'approved' && (
                      <button disabled={busyId === p.pharmacy_id} onClick={() => updateStatus(p.pharmacy_id, 'rejected', userId)} className="text-red-600 hover:underline disabled:opacity-50">Reject</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {pharmacies.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-500">No pharmacy applications yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
