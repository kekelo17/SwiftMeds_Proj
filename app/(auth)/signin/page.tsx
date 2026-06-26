'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { signInSchema } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setLoading(true);

  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: form.email.trim(),
    password: form.password.trim(),
  });
  
  if (error) {
    console.error("Supabase login error:", error);
    alert(error.message);
    return;
  }
  
  console.log("Success:", data);

    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('user_id', data.user.id)
      .single();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      toast.error('Your account has been deactivated. Contact support.');
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    const next = searchParams.get('next');
    router.push(next || `/dashboard/${profile?.role || 'client'}`);
    router.refresh();

    console.log(
      "Supabase URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
  };

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl font-bold text-ink-950">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-600">Sign in to reserve medication or manage your pharmacy.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Email address" type="email" id="email" placeholder="you@example.com"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <Input
            type="password" id="password" placeholder="••••••••"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        Don't have an account? <Link href="/signup" className="font-semibold text-brand-600 hover:underline">Create one</Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink-600">
        Own a pharmacy? <Link href="/signup/pharmacy" className="font-semibold text-brand-600 hover:underline">Register it here</Link>
      </p>
    </div>
  );
}
