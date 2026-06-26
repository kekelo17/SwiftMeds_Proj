'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { signUpPharmacySchema } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const EMPTY = {
  fullName: '', email: '', phoneNumber: '', password: '',
  pharmacyName: '', address: '', licenseNumber: '', pharmacyLicenseNumber: '',
};

export default function PharmacySignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpPharmacySchema.safeParse(form);
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
        data: {
          full_name: form.fullName,
          phone_number: form.phoneNumber,
          role: 'pharmacist',
          pharmacy_name: form.pharmacyName,
          address: form.address,
          license_number: form.licenseNumber,
          pharmacy_license_number: form.pharmacyLicenseNumber,
        },
      },
    });

    setLoading(false);
    if (error) return toast.error(error.message);

    toast.success('Application submitted! Our team will verify your DPML license before activation.');
    router.push('/verify');
  };

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl font-bold text-ink-950">Register your pharmacy</h1>
      <p className="mt-1.5 text-sm text-ink-600">
        Your pharmacy will be reviewed by our admin team for DPML license &amp; ONPC registration
        verification before it appears live on Swift Meds.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Your full name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
          <Input label="ONPC license #" value={form.licenseNumber} onChange={set('licenseNumber')} error={errors.licenseNumber} />
        </div>
        <Input label="Email address" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Input label="Phone number" value={form.phoneNumber} onChange={set('phoneNumber')} error={errors.phoneNumber} />
        <Input label="Password" type="password" value={form.password} onChange={set('password')} error={errors.password} />
        <hr className="border-ink-100" />
        <Input label="Pharmacy name" value={form.pharmacyName} onChange={set('pharmacyName')} error={errors.pharmacyName} />
        <Input label="Pharmacy address" value={form.address} onChange={set('address')} error={errors.address} />
        <Input label="DPML operating license #" value={form.pharmacyLicenseNumber} onChange={set('pharmacyLicenseNumber')} error={errors.pharmacyLicenseNumber} />

        <Button type="submit" loading={loading} className="w-full">Submit for review</Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        Already registered? <Link href="/signin" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
