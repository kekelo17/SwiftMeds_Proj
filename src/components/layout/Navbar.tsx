'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, Cross } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; role?: string; fullName?: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setUser(null);
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('user_id', data.user.id)
        .single();
      setUser({ id: data.user.id, role: profile?.role, fullName: profile?.full_name });
    });
  }, []);

  const dashboardHref = user?.role ? `/dashboard/${user.role}` : '/signin';

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/80 backdrop-blur-md">
      <nav className="section flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
            <Cross className="h-5 w-5" />
          </span>
          Swift Meds
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/search" className="text-sm font-medium text-ink-600 hover:text-brand-700">Find Medication</Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-ink-600 hover:text-brand-700">How it works</Link>
          <Link href="/#for-pharmacies" className="text-sm font-medium text-ink-600 hover:text-brand-700">For Pharmacies</Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <NotificationsDropdown userId={user.id} />
              <Link href={dashboardHref}><Button variant="secondary">Dashboard</Button></Link>
            </>
          ) : (
            <>
              <Link href="/signin"><Button variant="ghost">Sign in</Button></Link>
              <Link href="/signup"><Button variant="primary">Get Started</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/search" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">Find Medication</Link>
            <Link href="/#how-it-works" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">How it works</Link>
            <Link href="/#for-pharmacies" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">For Pharmacies</Link>
            <hr className="border-ink-100" />
            {user ? (
              <Link href={dashboardHref} onClick={() => setOpen(false)}><Button className="w-full">Dashboard</Button></Link>
            ) : (
              <div className="flex gap-3">
                <Link href="/signin" className="flex-1" onClick={() => setOpen(false)}><Button variant="secondary" className="w-full">Sign in</Button></Link>
                <Link href="/signup" className="flex-1" onClick={() => setOpen(false)}><Button className="w-full">Get Started</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
