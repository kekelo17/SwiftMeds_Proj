import { notFound, redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { formatXAF, formatDate } from '@/lib/utils';
import { ReservationStatusPoller } from '@/components/reservation/ReservationStatusPoller';
import { MapPin, Phone, Ticket } from 'lucide-react';

export default async function ReservationStatusPage({ params }: { params: { reservationId: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/signin');

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, pharmacy:pharmacy_id(*), medication:medication_id(*), payments(*)')
    .eq('reservation_id', params.reservationId)
    .single();

  if (!reservation) notFound();

  const pharmacy = (reservation as any).pharmacy;
  const medication = (reservation as any).medication;
  const payments = (reservation as any).payments || [];
  const latestPayment = payments[payments.length - 1];

  return (
    <>
      <Navbar />
      <main className="section max-w-xl py-10">
        <ReservationStatusPoller reservationId={reservation.reservation_id} initialStatus={reservation.status} />

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold text-ink-950">Reservation status</h1>
            <Badge status={reservation.status} />
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Medication</span><span className="font-medium text-ink-900">{medication.name} × {reservation.quantity}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Total</span><span className="font-medium text-ink-900">{formatXAF(reservation.total_amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Reserved on</span><span className="font-medium text-ink-900">{formatDate(reservation.created_at)}</span></div>
            {latestPayment && (
              <div className="flex justify-between"><span className="text-ink-500">Payment</span><Badge status={latestPayment.status} /></div>
            )}
          </div>

          {reservation.pickup_code && (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium text-brand-800"><Ticket className="h-4 w-4" /> Pickup code</span>
              <span className="font-display text-xl font-bold tracking-widest text-brand-800">{reservation.pickup_code}</span>
            </div>
          )}

          <hr className="my-5 border-ink-100" />

          <h2 className="text-sm font-semibold text-ink-900">Pickup location</h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600"><MapPin className="h-4 w-4" /> {pharmacy.name}, {pharmacy.address}</p>
          {pharmacy.phone && <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600"><Phone className="h-4 w-4" /> {pharmacy.phone}</p>}
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          Reservation for pickup only at the licensed pharmacy above. Swift Meds does not dispense medication.
        </p>
      </main>
    </>
  );
}
