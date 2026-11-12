import { supabase } from '../supabaseClient';

/** Wipes everything the anonymous demo user created, then signs them out. */
export async function exitDemo(): Promise<{ error: string | null }> {
  const { error: resetError } = await supabase.rpc('reset_demo_account');
  if (resetError) return { error: resetError.message };

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) return { error: signOutError.message };

  return { error: null };
}
