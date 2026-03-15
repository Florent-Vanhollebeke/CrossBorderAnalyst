// ============================================
// CrossBorder Analyst — Gestion historique simulations
// Supabase si connecté, localStorage sinon
// ============================================

import { createClient } from '@/lib/supabase/client';

export interface SimulationEntry {
  id: string;
  type: 'fiscal' | 'rent';
  timestamp: string;
  label: string;
  params: Record<string, unknown>;
}

const LS_KEY = 'crossborderanalyst_history';

// ============================================
// SAUVEGARDE
// ============================================

export async function saveSimulation(
  entry: Omit<SimulationEntry, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('simulations').insert({
        user_id: user.id,
        type: entry.type,
        label: entry.label,
        params: entry.params,
      });
      return;
    }
  } catch {
    // Supabase indisponible → fallback localStorage
  }

  // Fallback localStorage (utilisateur non connecté ou erreur réseau)
  try {
    const raw = localStorage.getItem(LS_KEY);
    const history: SimulationEntry[] = raw ? JSON.parse(raw) : [];
    history.unshift({
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(LS_KEY, JSON.stringify(history.slice(0, 50)));
  } catch { /* localStorage indisponible (SSR, private mode) */ }
}

// ============================================
// LECTURE
// ============================================

export async function loadSimulations(): Promise<SimulationEntry[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('simulations')
        .select('id, type, label, params, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        return data.map((row) => ({
          id: row.id,
          type: row.type as 'fiscal' | 'rent',
          label: row.label,
          params: row.params,
          timestamp: row.created_at,
        }));
      }
    }
  } catch { /* fallback */ }

  // Fallback localStorage
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ============================================
// STATS (pour StatsCard)
// ============================================

export async function loadSimulationStats(): Promise<{ total: number; lastDate: string | null }> {
  const entries = await loadSimulations();
  return {
    total: entries.length,
    lastDate: entries[0]?.timestamp ?? null,
  };
}
