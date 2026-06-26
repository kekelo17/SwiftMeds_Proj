import Link from 'next/link';
import { Search, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-radial">
      <div className="absolute inset-0 bg-brand-grid bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="section relative grid grid-cols-1 gap-12 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-card">
            <ShieldCheck className="h-3.5 w-3.5" /> DPML-verified pharmacies only
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink-950 sm:text-5xl">
            Find your medication.
            <span className="block text-brand-600">Reserve it. Pick it up.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-ink-600">
            Swift Meds connects you in real time to pharmacies across Yaoundé that have your
            medication in stock — no more calling around, no more guesswork.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/search"><Button className="px-7 py-3 text-base"><Search className="h-4 w-4" /> Search medication</Button></Link>
            <Link href="/signup/pharmacy"><Button variant="secondary" className="px-7 py-3 text-base">Register your pharmacy</Button></Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-ink-500">
            <div><span className="font-bold text-ink-900">1,200+</span> partnered pharmacies in Cameroon</div>
            <div className="h-8 w-px bg-ink-200" />
            <div><span className="font-bold text-ink-900">&lt;5s</span> average search time</div>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-sm rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2.5">
              <Search className="h-4 w-4 text-ink-400" />
              <span className="text-sm text-ink-400">Paracetamol 500mg</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { name: 'Pharmacie de la Paix', distance: '0.8 km', stock: 'In stock · 42 units', price: '1,200 XAF' },
                { name: 'Pharmacie Bastos', distance: '1.4 km', stock: 'In stock · 18 units', price: '1,150 XAF' },
                { name: 'Pharmacie Centrale', distance: '2.1 km', stock: 'Low stock · 3 units', price: '1,300 XAF' },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-500"><MapPin className="h-3 w-3" /> {p.distance} · {p.stock}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-700">{p.price}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 hidden h-24 w-24 animate-pulse-ring rounded-full border-4 border-brand-300 sm:block" />
        </div>
      </div>
    </section>
  );
}
