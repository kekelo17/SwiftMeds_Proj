import { redirect } from 'next/navigation';
import { LayoutDashboard, Package, ClipboardList, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';

const NAV = [
  { label: 'Overview', href: '/dashboard/pharmacist', icon: LayoutDashboard },
  { label: 'Inventory', href: '/dashboard/pharmacist/inventory', icon: Package },
  { label: 'Reservations', href: '/dashboard/pharmacist/reservations', icon: ClipboardList },
];

export default async function PharmacistDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/signin?next=/dashboard/pharmacist');

  const { data: profile } = await supabase.from('users').select('role').eq('user_id', auth.user.id).single();
  if (profile?.role !== 'pharmacist') redirect(`/dashboard/${profile?.role || ''}`);

  const { data: pharmacist } = await supabase
    .from('pharmacists')
    .select('pharmacy:pharmacy_id(name, status)')
    .eq('user_id', auth.user.id)
    .single();

  const pharmacyStatus = (pharmacist as any)?.pharmacy?.status;

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      <Sidebar items={NAV} basePath="/dashboard/pharmacist" />
      <div className="flex-1">
        <Topbar userId={auth.user.id} title={(pharmacist as any)?.pharmacy?.name || 'Pharmacist dashboard'} />
        {pharmacyStatus === 'pending' && (
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Store className="h-4 w-4" /> Your pharmacy is pending admin approval. It won't be visible to clients until verified.
          </div>
        )}
        {pharmacyStatus === 'suspended' && (
          <div className="flex items-center gap-2 bg-red-50 px-4 py-3 text-sm text-red-800">
            <Store className="h-4 w-4" /> Your pharmacy has been suspended. Contact support for details.
          </div>
        )}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
