import { Activity, ShieldCheck, BellRing, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: Activity, title: 'Live inventory sync', desc: 'Pharmacists update stock manually or automatically; clients always see accurate availability.' },
  { icon: ShieldCheck, title: 'Regulatory compliant', desc: 'Pharmacy onboarding requires DPML license verification and admin approval before going live.' },
  { icon: BellRing, title: 'Instant notifications', desc: 'Clients and pharmacists are notified at every step of the reservation lifecycle.' },
  { icon: BarChart3, title: 'Demand insights', desc: 'Pharmacies get analytics on local demand trends to optimize stocking and reduce expired-stock losses.' },
];

export function FeaturesGrid() {
  return (
    <section id="for-pharmacies" className="bg-ink-950 py-20">
      <div className="section">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white">Built for pharmacies, too</h2>
          <p className="mt-3 text-ink-300">A dedicated dashboard that turns idle inventory into a visible, monetizable asset.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/20 text-brand-400">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
