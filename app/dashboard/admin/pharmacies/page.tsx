import { createClient } from '@/lib/supabase/server';
import { PharmacyApprovalTable } from '@/components/dashboard/admin/PharmacyApprovalTable';

export default async function AdminPharmaciesPage() {
  const supabase = createClient();
  const { data: pharmacies } = await supabase
    .from('pharmacies')
    .select('*, pharmacists(license_number, user:user_id(full_name, email, phone_number))')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">Pharmacy applications</h2>
      <PharmacyApprovalTable pharmacies={(pharmacies || []) as any} />
    </div>
  );
}
