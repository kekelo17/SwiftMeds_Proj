'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { NotificationRow } from '@/types/database.types';
import { cn } from '@/lib/utils';

export function NotificationsDropdown({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(15)
      .then(({ data }) => { if (active && data) setItems(data as NotificationRow[]); });

    const channel = supabase
      .channel('notifications-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        setItems((prev) => [payload.new as NotificationRow, ...prev]);
      })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [userId]);

  const unread = items.filter((i) => !i.is_read).length;

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }}
        className="relative grid h-10 w-10 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-ink-100 bg-white p-2 shadow-soft">
          <div className="px-3 py-2 text-sm font-semibold text-ink-900">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-400">No notifications yet.</p>}
            {items.map((n) => (
              <div key={n.notification_id} className={cn('rounded-xl px-3 py-2.5 hover:bg-ink-50', !n.is_read && 'bg-brand-50')}>
                <p className="text-sm font-medium text-ink-900">{n.title}</p>
                <p className="text-xs text-ink-500">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
