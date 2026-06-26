import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Clock, Star, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { formatXAF, isPharmacyOpenNow, formatDate } from '@/lib/utils';
import { ReviewForm } from '@/components/pharmacy/ReviewForm';

export default async function PharmacyProfilePage({ params }: { params: { pharmacyId: string } }) {
  const supabase = createClient();

  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('pharmacy_id', params.pharmacyId)
    .eq('status', 'approved')
    .single();

  if (!pharmacy) notFound();

  const { data: inventory } = await supabase
    .from('inventory')
    .select('inventory_id, quantity, medication:medication_id(medication_id, name, generic_name, price, requires_prescription, category:category_id(name))')
    .eq('pharmacy_id', params.pharmacyId)
    .gt('quantity', 0)
    .order('quantity', { ascending: false });

  const { data: reviews } = await supabase
    .from('reviews')
    .select('review_id, rating, comment, date, client:client_id(user:user_id(full_name))')
    .eq('pharmacy_id', params.pharmacyId)
    .order('date', { ascending: false })
    .limit(20);

  const open = isPharmacyOpenNow(pharmacy.opening_hours, pharmacy.is_24h);

  return (
    <>
      <Navbar />
      <main>
        <section className="border-b border-ink-100 bg-white">
          <div className="section py-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <span className="badge bg-brand-100 text-brand-700"><ShieldCheck className="h-3 w-3" /> DPML verified</span>
                <h1 className="mt-3 font-display text-3xl font-bold text-ink-950">{pharmacy.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-600">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {pharmacy.address}</span>
                  {pharmacy.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {pharmacy.phone}</span>}
                  <span className={`flex items-center gap-1.5 font-medium ${open ? 'text-brand-600' : 'text-ink-400'}`}>
                    <Clock className="h-4 w-4" /> {open ? 'Open now' : 'Closed now'} {pharmacy.is_24h && '· 24/7'}
                  </span>
                  {pharmacy.average_rating > 0 && (
                    <span className="flex items-center gap-1.5 font-medium text-amber-600">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {pharmacy.average_rating} / 5
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section grid grid-cols-1 gap-10 py-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-xl font-semibold text-ink-900">Available medication</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(inventory || []).length === 0 && (
                <p className="text-sm text-ink-500">No medication currently in stock.</p>
              )}
              {(inventory || []).map((item: any) => (
                <div key={item.inventory_id} className="card p-4">
                  <p className="font-medium text-ink-900">{item.medication.name}</p>
                  {item.medication.generic_name && <p className="text-xs text-ink-500">{item.medication.generic_name}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-700">{formatXAF(item.medication.price)}</span>
                    <span className="text-xs text-ink-500">{item.quantity} in stock</span>
                  </div>
                  {item.medication.requires_prescription && (
                    <span className="mt-2 inline-block badge bg-amber-50 text-amber-700">Prescription required</span>
                  )}
                  <Link
                    href={`/reserve/${pharmacy.pharmacy_id}/${item.medication.medication_id}`}
                    className="btn-primary mt-3 w-full justify-center"
                  >
                    Reserve
                  </Link>
                </div>
              ))}
            </div>

            <h2 className="mt-12 font-display text-xl font-semibold text-ink-900">Reviews</h2>
            <div className="mt-5 space-y-4">
              {(reviews || []).length === 0 && <p className="text-sm text-ink-500">No reviews yet — be the first!</p>}
              {(reviews || []).map((r: any) => (
                <div key={r.review_id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink-900">{r.client?.user?.full_name || 'Anonymous'}</p>
                    <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {r.rating}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-ink-600">{r.comment}</p>}
                  <p className="mt-1 text-xs text-ink-400">{formatDate(r.date)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card sticky top-24 p-5">
              <h3 className="font-display font-semibold text-ink-900">Opening hours</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-600">
                {pharmacy.is_24h ? (
                  <li>Open 24 hours</li>
                ) : (
                  Object.entries(pharmacy.opening_hours || {}).map(([day, hours]: any) => (
                    <li key={day} className="flex justify-between capitalize">
                      <span>{day}</span>
                      <span>{hours ? `${hours.open} – ${hours.close}` : 'Closed'}</span>
                    </li>
                  ))
                )}
              </ul>
              <hr className="my-4 border-ink-100" />
              <ReviewForm pharmacyId={pharmacy.pharmacy_id} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
