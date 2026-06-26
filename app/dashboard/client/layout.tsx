import { redirect } from 'next/navigation';
import { LayoutDashboard, ClipboardList, UserCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';

const NAV = [
  { label: 'Overview', href: '/dashboard/client', icon: LayoutDashboard },
  { label: 'My reservations', href: '/dashboard/client/reservations', icon: ClipboardList },
  { label: 'Profile', href: '/dashboard/client/profile', icon: UserCircle },
];

export default async function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/signin?next=/dashboard/client');

  const { data: profile } = await supabase.from('users').select('role').eq('user_id', auth.user.id).single();
  if (profile?.role !== 'client') redirect(`/dashboard/${profile?.role || ''}`);

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      <Sidebar items={NAV} basePath="/dashboard/client" />
      <div className="flex-1">
        <Topbar userId={auth.user.id} title="Client dashboard" />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
