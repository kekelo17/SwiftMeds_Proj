import { createClient } from '@/lib/supabase/server';
import { InventoryTable } from '@/components/dashboard/pharmacist/InventoryTable';
import { AddMedicationModal } from '@/components/dashboard/pharmacist/AddMedicationModal';

export default async function PharmacistInventoryPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: pharmacist } = await supabase.from('pharmacists').select('pharmacy_id').eq('user_id', auth.user!.id).single();
  const pharmacyId = pharmacist!.pharmacy_id!;

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*, medication:medication_id(*, category:category_id(name))')
    .eq('pharmacy_id', pharmacyId)
    .order('last_updated', { ascending: false });

  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink-900">Inventory</h2>
        <AddMedicationModal pharmacyId={pharmacyId} categories={categories || []} />
      </div>
      <InventoryTable items={(inventory || []) as any} pharmacyId={pharmacyId} />
    </div>
  );
}
