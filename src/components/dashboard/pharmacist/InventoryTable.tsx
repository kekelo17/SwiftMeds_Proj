'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Pencil, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatXAF, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function InventoryTable({ items, pharmacyId }: { items: any[]; pharmacyId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(0);

  const startEdit = (id: string, qty: number) => { setEditingId(id); setQuantity(qty); };

  const saveQuantity = async (inventoryId: string) => {
    const { error } = await supabase.from('inventory').update({ quantity, last_updated: new Date().toISOString() }).eq('inventory_id', inventoryId);
    setEditingId(null);
    if (error) return toast.error(error.message);
    toast.success('Stock updated');
    router.refresh();
  };

  const removeItem = async (inventoryId: string) => {
    if (!confirm('Remove this medication from your inventory?')) return;
    const { error } = await supabase.from('inventory').delete().eq('inventory_id', inventoryId);
    if (error) return toast.error(error.message);
    toast.success('Removed');
    router.refresh();
  };

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-5 py-3">Medication</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Price</th>
            <th className="px-5 py-3">Stock</th>
            <th className="px-5 py-3">Updated</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {items.map((item) => {
            const low = item.quantity <= item.low_stock_alert;
            return (
              <tr key={item.inventory_id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-ink-900">{item.medication.name}</p>
                  <p className="text-xs text-ink-500">{item.medication.generic_name}</p>
                </td>
                <td className="px-5 py-3 text-ink-600">{item.medication.category?.name || '—'}</td>
                <td className="px-5 py-3 text-ink-600">{formatXAF(item.medication.price)}</td>
                <td className="px-5 py-3">
                  {editingId === item.inventory_id ? (
                    <input
                      type="number"
                      autoFocus
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      onBlur={() => saveQuantity(item.inventory_id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveQuantity(item.inventory_id)}
                      className="w-20 rounded-lg border border-brand-400 px-2 py-1 text-sm"
                    />
                  ) : (
                    <button onClick={() => startEdit(item.inventory_id, item.quantity)} className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', low ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700')}>
                      {item.quantity} units
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-500">{formatDate(item.last_updated)}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => startEdit(item.inventory_id, item.quantity)} className="text-ink-400 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => removeItem(item.inventory_id)} className="text-ink-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-500">No medication added yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
