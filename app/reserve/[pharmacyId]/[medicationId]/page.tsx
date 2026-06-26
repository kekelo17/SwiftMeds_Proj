import { notFound, redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/server';
import { ReservationForm } from '@/components/reservation/ReservationForm';

export default async function ReservePage({ params }: { params: { pharmacyId: string; medicationId: string } }) {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/signin?next=/reserve/${params.pharmacyId}/${params.medicationId}`);

  const { data: client } = await supabase.from('clients').select('client_id').eq('user_id', auth.user.id).single();
  if (!client) redirect('/signin');

  const { data: pharmacy } = await supabase.from('pharmacies').select('*').eq('pharmacy_id', params.pharmacyId).single();
  const { data: inventoryItem } = await supabase
    .from('inventory')
    .select('quantity, medication:medication_id(*)')
    .eq('pharmacy_id', params.pharmacyId)
    .eq('medication_id', params.medicationId)
    .single();

  if (!pharmacy || !inventoryItem) notFound();

  return (
    <>
      <Navbar />
      <main className="section max-w-2xl py-10">
        <h1 className="font-display text-2xl font-bold text-ink-950">Reserve medication</h1>
        <p className="mt-1.5 text-sm text-ink-600">
          Pickup at <span className="font-semibold text-ink-800">{pharmacy.name}</span>, {pharmacy.address}.
          Your reservation is held for 2 hours after payment confirmation.
        </p>

        <ReservationForm
          userId={auth.user.id}
          clientId={client.client_id}
          pharmacy={pharmacy}
          medication={inventoryItem.medication as any}
          availableQuantity={inventoryItem.quantity}
        />
      </main>
    </>
  );
}
