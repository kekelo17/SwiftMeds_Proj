'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { UserRow } from '@/types/database.types';

export function ProfileForm({ profile }: { profile: UserRow }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    fullName: profile.full_name,
    phoneNumber: profile.phone_number || '',
    address: profile.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: form.fullName, phone_number: form.phoneNumber, address: form.address })
      .eq('user_id', profile.user_id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Profile updated');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
      <Input label="Email" value={profile.email} disabled className="bg-ink-50 text-ink-400" />
      <Input label="Phone number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
      <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <Button type="submit" loading={loading}>Save changes</Button>
    </form>
  );
}
