import Link from 'next/link';
import { MailCheck } from 'lucide-react';

export default function VerifyPage() {
  return (
    <div className="animate-fade-up text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
        <MailCheck className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-ink-950">Confirm your email</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600">
        We've sent a confirmation link to your inbox. Click it to activate your account, then sign in.
        Pharmacy accounts additionally require admin approval of your DPML license before going live.
      </p>
      <Link href="/signin" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline">Back to sign in</Link>
    </div>
  );
}
