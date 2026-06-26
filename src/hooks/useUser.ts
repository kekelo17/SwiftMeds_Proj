'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRow } from '@/types/database.types';

export function useUser() {
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { if (active) { setProfile(null); setLoading(false); } return; }
      const { data: row } = await supabase.from('users').select('*').eq('user_id', data.user.id).single();
      if (active) { setProfile(row as UserRow); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  return { profile, loading };
}
