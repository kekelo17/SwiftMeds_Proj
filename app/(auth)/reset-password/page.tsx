'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Password updated. Please sign in again.');
    await supabase.auth.signOut();
    router.push('/signin');
  };

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl font-bold text-ink-950">Set a new password</h1>
      <p className="mt-1.5 text-sm text-ink-600">Choose a strong password you haven't used before.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" loading={loading} className="w-full">Update password</Button>
      </form>
    </div>
  );
}
