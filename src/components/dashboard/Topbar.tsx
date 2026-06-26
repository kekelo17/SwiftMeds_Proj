'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

export function Topbar({ userId, title }: { userId: string; title: string }) {
  const supabase = createClient();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 sm:px-6">
      <h1 className="font-display text-lg font-semibold text-ink-900">{title}</h1>
      <div className="flex items-center gap-3">
        <NotificationsDropdown userId={userId} />
        <button onClick={signOut} className="grid h-10 w-10 place-items-center rounded-full text-ink-500 hover:bg-ink-100" aria-label="Sign out">
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
