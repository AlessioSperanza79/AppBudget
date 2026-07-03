import { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import { Obiettivo } from '../../types';
import { FinanceState } from './types';
import { creaRollbackSeErrore } from './rollback';
import { generaId } from './id';

export interface ObiettiviSlice {
  obiettivi: Obiettivo[];
  aggiungiObiettivo: (dati: Omit<Obiettivo, 'id'>) => Promise<void>;
  modificaObiettivo: (id: string, aggiornamenti: Partial<Omit<Obiettivo, 'id'>>) => Promise<void>;
  eliminaObiettivo: (id: string) => Promise<void>;
}

export const createObiettiviSlice: StateCreator<FinanceState, [], [], ObiettiviSlice> = (set, get) => {
  const rollbackSeErrore = creaRollbackSeErrore(get);

  return {
    obiettivi: [],

    aggiungiObiettivo: async (dati) => {
      const nuovo: Obiettivo = { ...dati, id: generaId() };
      set((s) => ({ obiettivi: [...s.obiettivi, nuovo] }));
      const { error } = await supabase.from('obiettivi').insert({
        id: nuovo.id,
        nome: nuovo.nome,
        importo_obiettivo: nuovo.importoObiettivo,
        importo_attuale: nuovo.importoAttuale,
        colore: nuovo.colore,
        data_scadenza: nuovo.dataScadenza ?? null,
      });
      rollbackSeErrore('aggiungi obiettivo', error);
    },

    modificaObiettivo: async (id, aggiornamenti) => {
      set((s) => ({
        obiettivi: s.obiettivi.map((o) => o.id === id ? { ...o, ...aggiornamenti } : o),
      }));
      const dbUpdate: Record<string, unknown> = {};
      if (aggiornamenti.nome             !== undefined) dbUpdate.nome              = aggiornamenti.nome;
      if (aggiornamenti.importoObiettivo !== undefined) dbUpdate.importo_obiettivo = aggiornamenti.importoObiettivo;
      if (aggiornamenti.importoAttuale   !== undefined) dbUpdate.importo_attuale   = aggiornamenti.importoAttuale;
      if (aggiornamenti.colore           !== undefined) dbUpdate.colore            = aggiornamenti.colore;
      if (aggiornamenti.dataScadenza     !== undefined) dbUpdate.data_scadenza     = aggiornamenti.dataScadenza ?? null;
      const { error } = await supabase.from('obiettivi').update(dbUpdate).eq('id', id);
      rollbackSeErrore('modifica obiettivo', error);
    },

    eliminaObiettivo: async (id) => {
      set((s) => ({ obiettivi: s.obiettivi.filter((o) => o.id !== id) }));
      const { error } = await supabase.from('obiettivi').delete().eq('id', id);
      rollbackSeErrore('elimina obiettivo', error);
    },
  };
};
