import { createClient } from '@/lib/supabase/server';
import { UsersTable } from '@/components/dashboard/admin/UsersTable';

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">All users</h2>
      <UsersTable users={(users || []) as any} />
    </div>
  );
}
