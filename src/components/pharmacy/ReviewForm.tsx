'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function ReviewForm({ pharmacyId }: { pharmacyId: string }) {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) return toast.error('Please select a rating');
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      return toast.error('Please sign in to leave a review');
    }

    const { data: client } = await supabase.from('clients').select('client_id').eq('user_id', auth.user.id).single();
    if (!client) { setLoading(false); return toast.error('Only client accounts can leave reviews'); }

    const { error } = await supabase.from('reviews').upsert({
      client_id: client.client_id,
      pharmacy_id: pharmacyId,
      rating,
      comment,
    }, { onConflict: 'client_id,pharmacy_id' });

    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Thanks for your feedback!');
    setComment('');
    setRating(0);
  };

  return (
    <div>
      <h3 className="font-display font-semibold text-ink-900">Leave a review</h3>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star className={cn('h-6 w-6', n <= rating ? 'fill-amber-500 text-amber-500' : 'text-ink-200')} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience…"
        className="input mt-3 min-h-[80px]"
      />
      <Button onClick={submit} loading={loading} className="mt-3 w-full">Submit review</Button>
    </div>
  );
}
