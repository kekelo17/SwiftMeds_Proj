import { redirect } from 'next/navigation';
import { LayoutDashboard, Store, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';

const NAV = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Pharmacies', href: '/dashboard/admin/pharmacies', icon: Store },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users },
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/signin?next=/dashboard/admin');

  const { data: profile } = await supabase.from('users').select('role').eq('user_id', auth.user.id).single();
  if (profile?.role !== 'admin') redirect(`/dashboard/${profile?.role || ''}`);

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      <Sidebar items={NAV} basePath="/dashboard/admin" />
      <div className="flex-1">
        <Topbar userId={auth.user.id} title="Admin dashboard" />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
