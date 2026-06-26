'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { addMedicationSchema } from '@/lib/validations';
import type { CategoryRow } from '@/types/database.types';

export function AddMedicationModal({ pharmacyId, categories }: { pharmacyId: string; categories: CategoryRow[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', genericName: '', description: '', dosage: '', price: '', quantity: '',
    categoryId: '', requiresPrescription: false,
  });

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = addMedicationSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);

    // 1. Find or create the medication record (catalog is shared across pharmacies)
    const { data: existing } = await supabase
      .from('medications')
      .select('medication_id')
      .ilike('name', form.name)
      .maybeSingle();

    let medicationId = existing?.medication_id;

    if (!medicationId) {
      const { data: newMed, error: medError } = await supabase
        .from('medications')
        .insert({
          name: form.name,
          generic_name: form.genericName || null,
          description: form.description || null,
          dosage: form.dosage || null,
          price: Number(form.price),
          category_id: form.categoryId || null,
          requires_prescription: form.requiresPrescription,
        })
        .select('medication_id')
        .single();
      if (medError) { setLoading(false); return toast.error(medError.message); }
      medicationId = newMed.medication_id;
    }

    // 2. Upsert inventory row for this pharmacy
    const { error: invError } = await supabase
      .from('inventory')
      .upsert({ pharmacy_id: pharmacyId, medication_id: medicationId, quantity: Number(form.quantity), last_updated: new Date().toISOString() }, { onConflict: 'pharmacy_id,medication_id' });

    setLoading(false);
    if (invError) return toast.error(invError.message);

    toast.success('Medication added to inventory');
    setOpen(false);
    setForm({ name: '', genericName: '', description: '', dosage: '', price: '', quantity: '', categoryId: '', requiresPrescription: false });
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add medication</Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink-900">Add medication to inventory</h3>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-ink-400" /></button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Name" value={form.name} onChange={set('name')} required />
                <Input label="Generic name" value={form.genericName} onChange={set('genericName')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Dosage" value={form.dosage} onChange={set('dosage')} placeholder="e.g. 500mg" />
                <Select label="Category" value={form.categoryId} onChange={set('categoryId')}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Price (XAF)" type="number" value={form.price} onChange={set('price')} required />
                <Input label="Quantity in stock" type="number" value={form.quantity} onChange={set('quantity')} required />
              </div>
              <Input label="Description" value={form.description} onChange={set('description')} />
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => setForm((f) => ({ ...f, requiresPrescription: e.target.checked }))} />
                Requires a prescription upload (DPML restricted medication)
              </label>
              <Button type="submit" loading={loading} className="w-full">Save medication</Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
