import Link from 'next/link';
import { Cross } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-950 text-ink-300">
      <div className="section grid grid-cols-1 gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Cross className="h-5 w-5" />
            </span>
            Swift Meds
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-400">
            Real-time medication availability and fast dispensing for Yaoundé. A digital
            bridge between patients and licensed pharmacies — not a dispensary itself.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Platform</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/search" className="hover:text-brand-400">Find medication</Link></li>
            <li><Link href="/signup" className="hover:text-brand-400">Create account</Link></li>
            <li><Link href="/signup/pharmacy" className="hover:text-brand-400">Register a pharmacy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Compliance</h4>
          <ul className="space-y-2.5 text-sm">
            <li>DPML-verified pharmacy listings</li>
            <li>ONPC-registered pharmacists only</li>
            <li>Law N°2010/012 data protection</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Disclaimer</h4>
          <p className="text-sm leading-6 text-ink-400">
            Swift Meds does not dispense medication. It facilitates reservation and pickup
            exclusively at physical, licensed pharmacies in Yaoundé.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} Swift Meds — Yaoundé, Cameroon. All rights reserved.
      </div>
    </footer>
  );
}
