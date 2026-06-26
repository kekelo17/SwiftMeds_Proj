'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { signUpClientSchema } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpClientSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: { full_name: form.fullName, phone_number: form.phoneNumber, role: 'client' },
      },
    });

    setLoading(false);
    if (error) return toast.error(error.message);

    toast.success('Account created! Check your email to confirm your address.');
    router.push('/verify');

  };

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl font-bold text-ink-950">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-600">Search medication and reserve it across Yaoundé's pharmacies.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input label="Full name" id="fullName" placeholder="Jane Doe" value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} />
        <Input label="Email address" type="email" id="email" placeholder="you@example.com" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <Input label="Phone number" id="phoneNumber" placeholder="6XX XXX XXX" value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} error={errors.phoneNumber} />
        <Input label="Password" type="password" id="password" placeholder="At least 8 characters" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        Already have an account? <Link href="/signin" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink-600">
        Own a pharmacy? <Link href="/signup/pharmacy" className="font-semibold text-brand-600 hover:underline">Register it here</Link>
      </p>
      
    </div>

    
  );
}
