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

-- ── 5. Patrimonio netto: beni/debiti manuali + storico mensile ──
CREATE TABLE IF NOT EXISTS patrimonio_voci (
  id text PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('attivo', 'passivo')),
  valore numeric NOT NULL DEFAULT 0,
  colore text NOT NULL DEFAULT '#2563EB',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE patrimonio_voci ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consenti tutto su patrimonio_voci" ON patrimonio_voci
  FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE patrimonio_voci;

CREATE TABLE IF NOT EXISTS patrimonio_storico (
  data text PRIMARY KEY,  -- 'YYYY-MM'
  valore numeric NOT NULL
);
ALTER TABLE patrimonio_storico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consenti tutto su patrimonio_storico" ON patrimonio_storico
  FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE patrimonio_storico;
