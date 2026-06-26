'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const cancel = async () => {
    if (!confirm('Cancel this reservation? Your slot will be released.')) return;
    setLoading(true);
    const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: reservationId });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Reservation cancelled');
    router.refresh();
  };

  return (
    <button onClick={cancel} disabled={loading} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
      Cancel
    </button>
  );
}
