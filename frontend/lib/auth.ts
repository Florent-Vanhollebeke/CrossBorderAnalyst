import { createClient } from '@/lib/supabase/client';

/**
 * Retourne le client Supabase browser-side.
 * Utilisé par les composants client qui ont besoin d'accès direct.
 */
export function getSupabaseClient() {
  return createClient();
}

/**
 * Retourne l'utilisateur courant ou null si non connecté.
 */
export async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Déconnecte l'utilisateur courant.
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
