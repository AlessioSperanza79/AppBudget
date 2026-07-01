-- ════════════════════════════════════════════════════════════════════════
-- Migrazioni da eseguire UNA VOLTA nell'SQL Editor di Supabase
-- (Project Settings → SQL Editor → New query → Run)
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Tag/etichette sulle transazioni ──
ALTER TABLE transazioni ADD COLUMN IF NOT EXISTS tag text;

-- ── 2. Obiettivi di risparmio ──
CREATE TABLE IF NOT EXISTS obiettivi (
  id text PRIMARY KEY,
  nome text NOT NULL,
  importo_obiettivo numeric NOT NULL,
  importo_attuale numeric NOT NULL DEFAULT 0,
  colore text NOT NULL DEFAULT '#3B82F6',
  data_scadenza date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Se le altre tabelle (transazioni, categorie, istituti) hanno la Row Level
-- Security abilitata con una policy "consenti tutto" per il ruolo anon,
-- replica la stessa policy qui. Se invece RLS è disabilitata sulle altre
-- tabelle, lascia anche questa disabilitata (comportamento di default).
ALTER TABLE obiettivi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consenti tutto su obiettivi" ON obiettivi
  FOR ALL USING (true) WITH CHECK (true);

-- ── 3. Realtime: aggiungi la nuova tabella alla pubblicazione realtime ──
-- (necessario solo se le altre tabelle sono già nella pubblicazione)
ALTER PUBLICATION supabase_realtime ADD TABLE obiettivi;

-- ── 4. Piano a somma zero: rollover dell'avanzo di budget tra un mese e l'altro ──
ALTER TABLE categorie ADD COLUMN IF NOT EXISTS rollover boolean NOT NULL DEFAULT false;
