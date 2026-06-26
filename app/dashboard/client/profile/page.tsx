import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/dashboard/client/ProfileForm';

export default async function ClientProfilePage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('*').eq('user_id', auth.user!.id).single();

  return (
    <div className="max-w-lg">
      <div className="card p-6">
        <h2 className="font-display font-semibold text-ink-900">Your profile</h2>
        <ProfileForm profile={profile!} />
      </div>
    </div>
  );
}
