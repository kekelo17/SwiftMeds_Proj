import Link from 'next/link';
import { Cross } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-brand-radial opacity-40" />
        <Link href="/" className="relative z-10 flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            <Cross className="h-5 w-5" />
          </span>
          Swift Meds
        </Link>
        <div className="relative z-10">
          <p className="font-display text-3xl font-semibold leading-tight">
            "Each unsuccessful pharmacy visit drains time, money, and hope. Swift Meds closes that gap."
          </p>
          <p className="mt-4 text-sm text-brand-200">
            Real-time medication availability for the people of Yaoundé.
          </p>
        </div>
        <p className="relative z-10 text-xs text-brand-300">
          Operating in compliance with DPML &amp; ONPC regulations · Law N°2010/012 on data protection
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
