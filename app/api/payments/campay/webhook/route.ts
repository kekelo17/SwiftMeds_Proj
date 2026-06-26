import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/payments/campay/webhook
 * Campay calls this URL when a collection transaction completes
 * (SUCCESSFUL or FAILED). Configure this URL in your Campay dashboard.
 *
 * Expected payload (per Campay docs):
 * { reference, status, amount, currency, external_reference, operator, ... }
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-campay-signature');

  if (process.env.CAMPAY_WEBHOOK_SECRET && signature) {
    const expected = crypto
      .createHmac('sha256', process.env.CAMPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody);
  const { reference, status, external_reference } = payload;

  const supabase = createServiceClient();

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('external_reference', external_reference)
    .single();

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  const newStatus = status === 'SUCCESSFUL' ? 'successful' : status === 'FAILED' ? 'failed' : 'pending';

  await supabase
    .from('payments')
    .update({ status: newStatus, transaction_reference: reference })
    .eq('payment_id', payment.payment_id);

  if (newStatus === 'successful') {
    const { data: reservation } = await supabase
      .from('reservations')
      .update({ status: 'confirmed', pickup_code: Math.random().toString(36).slice(2, 8).toUpperCase() })
      .eq('reservation_id', payment.reservation_id)
      .select('*, clients:client_id(user_id), pharmacies:pharmacy_id(name)')
      .single();

    if (reservation) {
      await supabase.from('notifications').insert({
        user_id: (reservation as any).clients.user_id,
        title: 'Payment successful',
        message: `Your reservation at ${(reservation as any).pharmacies.name} is confirmed. Show your pickup code at the counter.`,
        notification_type: 'payment',
        related_id: payment.reservation_id,
      });
    }
  } else if (newStatus === 'failed') {
    // Release the reservation back to pending and restock inventory.
    await supabase.rpc('cancel_reservation', { p_reservation_id: payment.reservation_id });
  }

  return NextResponse.json({ received: true });
}
