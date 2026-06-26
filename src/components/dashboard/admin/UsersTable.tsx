'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { formatDate, cn } from '@/lib/utils';
import type { UserRow } from '@/types/database.types';

export function UsersTable({ users }: { users: UserRow[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleActive = async (userId: string, isActive: boolean) => {
    setBusyId(userId);
    const { error } = await supabase.from('users').update({ is_active: !isActive }).eq('user_id', userId);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(!isActive ? 'User reactivated' : 'User deactivated');
    router.refresh();
  };

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">Joined</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {users.map((u) => (
            <tr key={u.user_id}>
              <td className="px-5 py-3 font-medium text-ink-900">{u.full_name}</td>
              <td className="px-5 py-3 text-ink-600">{u.email}</td>
              <td className="px-5 py-3 capitalize text-ink-600">{u.role}</td>
              <td className="px-5 py-3 text-ink-500">{formatDate(u.created_at)}</td>
              <td className="px-5 py-3">
                <span className={cn('badge', u.is_active ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-700')}>
                  {u.is_active ? 'Active' : 'Deactivated'}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                {u.role !== 'admin' && (
                  <button
                    disabled={busyId === u.user_id}
                    onClick={() => toggleActive(u.user_id, u.is_active)}
                    className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
                  >
                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
