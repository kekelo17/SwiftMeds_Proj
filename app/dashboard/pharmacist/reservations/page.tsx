import { createClient } from '@/lib/supabase/server';
import { ReservationsManager } from '@/components/dashboard/pharmacist/ReservationsManager';

export default async function PharmacistReservationsPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: pharmacist } = await supabase.from('pharmacists').select('pharmacy_id').eq('user_id', auth.user!.id).single();

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, client:client_id(user:user_id(full_name, phone_number)), medication:medication_id(name)')
    .eq('pharmacy_id', pharmacist!.pharmacy_id!)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">Reservations</h2>
      <ReservationsManager reservations={(reservations || []) as any} />
    </div>
  );
}
