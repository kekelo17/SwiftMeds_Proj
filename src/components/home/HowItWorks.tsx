import { Search, MapPinned, CreditCard, PackageCheck } from 'lucide-react';

const STEPS = [
  { icon: Search, title: 'Search', desc: 'Type the medication you need — we check stock across every partnered pharmacy in real time.' },
  { icon: MapPinned, title: 'Locate', desc: 'See which pharmacies have it, their distance from you, and their opening hours.' },
  { icon: CreditCard, title: 'Reserve & Pay', desc: 'Reserve your quantity and pay securely with MTN MoMo or Orange Money via Campay.' },
  { icon: PackageCheck, title: 'Pick up', desc: 'Walk in with your pickup code — your medication is held and ready, guaranteed.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold text-ink-950">How Swift Meds works</h2>
        <p className="mt-3 text-ink-600">From search to pickup in four simple steps — designed for emergencies and daily needs alike.</p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="card group relative p-6 transition-transform hover:-translate-y-1">
            <span className="absolute right-5 top-5 font-display text-4xl font-bold text-ink-100">{i + 1}</span>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-700">
              <step.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-600">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
