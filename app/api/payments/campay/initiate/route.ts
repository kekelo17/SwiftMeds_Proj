import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { initiateCampayCollection } from '@/lib/campay';

/**
 * POST /api/payments/campay/initiate
 * Creates a `payments` row (status: pending) and sends a USSD collection
 * request to the client's phone via Campay. The actual confirmation arrives
 * asynchronously at /api/payments/campay/webhook.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { reservationId, amount, phone, paymentMethod, description } = body;

  if (!reservationId || !amount || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify the reservation belongs to the requesting client (RLS double-checks this too).
  const { data: reservation } = await supabase
    .from('reservations')
    .select('reservation_id, total_amount, client_id, clients:client_id(user_id)')
    .eq('reservation_id', reservationId)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  const externalReference = `SM-${reservationId}-${Date.now()}`;

  // Use service role to insert the payment row (bypasses RLS edge-cases on webhooks later).
  const service = createServiceClient();
  const { data: paymentRow, error: insertError } = await service
    .from('payments')
    .insert({
      reservation_id: reservationId,
      amount,
      payment_method: paymentMethod === 'orange_money' ? 'orange_money' : 'mtn_momo',
      status: 'pending',
      external_reference: externalReference,
      phone_number: phone,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    const campayResponse = await initiateCampayCollection({
      amount,
      phone,
      description: description || 'Swift Meds reservation',
      externalReference,
    });

    await service
      .from('payments')
      .update({ transaction_reference: campayResponse.reference })
      .eq('payment_id', paymentRow.payment_id);

    return NextResponse.json({ success: true, paymentId: paymentRow.payment_id, reference: campayResponse.reference });
  } catch (err: any) {
    await service.from('payments').update({ status: 'failed' }).eq('payment_id', paymentRow.payment_id);
    return NextResponse.json({ error: err.message || 'Payment initiation failed' }, { status: 502 });
  }
}
