'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PrescriptionUpload } from '@/components/reservation/PrescriptionUpload';
import { PaymentMethodSelector } from '@/components/reservation/PaymentMethodSelector';
import { formatXAF } from '@/lib/utils';
import type { MedicationRow, PharmacyRow } from '@/types/database.types';

interface ReservationFormProps {
  userId: string;
  clientId: string;
  pharmacy: PharmacyRow;
  medication: MedicationRow;
  availableQuantity: number;
}

export function ReservationForm({ userId, clientId, pharmacy, medication, availableQuantity }: ReservationFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [prescriptionPath, setPrescriptionPath] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'paying'>('form');
  const [loading, setLoading] = useState(false);

  const total = medication.price * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity < 1 || quantity > availableQuantity) {
      return toast.error(`Quantity must be between 1 and ${availableQuantity}`);
    }
    if (medication.requires_prescription && !prescriptionPath) {
      return toast.error('This medication requires a prescription upload.');
    }
    if (phoneNumber.length < 9) {
      return toast.error('Enter a valid mobile money number.');
    }

    setLoading(true);
    setStep('paying');

    // 1. Create the reservation (atomically decrements stock server-side)
    const { data: reservation, error: resError } = await supabase.rpc('create_reservation', {
      p_client_id: clientId,
      p_pharmacy_id: pharmacy.pharmacy_id,
      p_medication_id: medication.medication_id,
      p_quantity: quantity,
      p_patient_name: patientName || null,
      p_prescription_url: prescriptionPath,
    });

    if (resError || !reservation) {
      setLoading(false);
      setStep('form');
      return toast.error(resError?.message || 'Could not create reservation. Please try again.');
    }

    // 2. Kick off Campay collection via our server route (keeps credentials server-side)
    const res = await fetch('/api/payments/campay/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservationId: reservation.reservation_id,
        amount: total,
        phone: phoneNumber,
        paymentMethod,
        description: `Swift Meds — ${medication.name} x${quantity}`,
      }),
    });

    const payload = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(payload.error || 'Payment could not be initiated.');
      setStep('form');
      return;
    }

    toast.success('Check your phone to approve the mobile money payment prompt.');
    router.push(`/reservation/${reservation.reservation_id}`);
  };

  if (step === 'paying' && loading) {
    return (
      <div className="card mt-8 p-8 text-center">
        <p className="text-sm text-ink-600">Creating your reservation and contacting Campay…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-ink-900">{medication.name}</p>
            {medication.generic_name && <p className="text-xs text-ink-500">{medication.generic_name} · {medication.dosage}</p>}
          </div>
          <span className="text-sm font-bold text-brand-700">{formatXAF(medication.price)} / unit</span>
        </div>
        {medication.requires_prescription && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <ShieldAlert className="h-4 w-4" /> This medication requires a valid prescription (DPML regulation).
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`Quantity (max ${availableQuantity})`} type="number" min={1} max={availableQuantity}
          value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <Input label="Patient name (optional)" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
      </div>

      <Input
        label="Mobile money number" placeholder="6XX XXX XXX" value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />

      {medication.requires_prescription && (
        <PrescriptionUpload userId={userId} onUploaded={setPrescriptionPath} />
      )}

      <div>
        <label className="label">Pay with</label>
        <PaymentMethodSelector value={paymentMethod} onChange={(v) => setPaymentMethod(v as any)} />
      </div>

      <div className="card flex items-center justify-between p-4">
        <span className="text-sm text-ink-600">Total to pay</span>
        <span className="font-display text-xl font-bold text-ink-950">{formatXAF(total)}</span>
      </div>

      <Button type="submit" loading={loading} className="w-full py-3 text-base">
        Reserve &amp; pay {formatXAF(total)}
      </Button>
      <p className="text-center text-xs text-ink-400">
        Reservation for pickup only at the licensed pharmacy above. Swift Meds does not dispense medication.
      </p>
    </form>
  );
}
