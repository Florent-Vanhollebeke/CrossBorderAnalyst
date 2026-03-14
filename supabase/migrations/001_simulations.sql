-- ============================================
-- SwissRelocator — Table historique simulations
-- À exécuter dans le SQL Editor de ton dashboard Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS simulations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('fiscal', 'rent')),
  label       TEXT        NOT NULL,
  params      JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes par user
CREATE INDEX IF NOT EXISTS simulations_user_id_idx ON simulations(user_id, created_at DESC);

-- Row Level Security : chaque user ne voit que ses propres simulations
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own simulations"
  ON simulations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
