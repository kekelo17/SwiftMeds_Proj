'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export function ReservationStatusPoller({ reservationId, initialStatus }: { reservationId: string; initialStatus: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const channel = supabase
      .channel('reservation-' + reservationId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservations', filter: `reservation_id=eq.${reservationId}` },
        (payload) => {
          const next = (payload.new as any).status;
          if (next !== status) {
            setStatus(next);
            toast.success(`Reservation status updated: ${next}`);
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [reservationId, status]);

  return null;
}
