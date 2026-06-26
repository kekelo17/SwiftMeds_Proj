'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink-950">Check your inbox</h1>
        <p className="mt-2 text-sm text-ink-600">We sent a password reset link to {email}.</p>
        <Link href="/signin" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl font-bold text-ink-950">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink-600">Enter your email and we'll send you a reset link.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-600">
        <Link href="/signin" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
