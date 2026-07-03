import { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import { VocePatrimonio, SnapshotPatrimonio } from '../../types';
import { FinanceState } from './types';
import { creaRollbackSeErrore } from './rollback';
import { generaId } from './id';

export interface PatrimonioSlice {
  patrimonioVoci: VocePatrimonio[];
  patrimonioStorico: SnapshotPatrimonio[];
  aggiungiVocePatrimonio: (dati: Omit<VocePatrimonio, 'id'>) => Promise<void>;
  modificaVocePatrimonio: (id: string, aggiornamenti: Partial<Omit<VocePatrimonio, 'id'>>) => Promise<void>;
  eliminaVocePatrimonio: (id: string) => Promise<void>;
  aggiornaSnapshotPatrimonio: () => Promise<void>;
}

export const createPatrimonioSlice: StateCreator<FinanceState, [], [], PatrimonioSlice> = (set, get) => {
  const rollbackSeErrore = creaRollbackSeErrore(get);

  return {
    patrimonioVoci: [],
    patrimonioStorico: [],

    aggiungiVocePatrimonio: async (dati) => {
      const nuova: VocePatrimonio = { ...dati, id: generaId() };
      set((s) => ({ patrimonioVoci: [...s.patrimonioVoci, nuova] }));
      const { error } = await supabase.from('patrimonio_voci').insert({
        id: nuova.id, nome: nuova.nome, tipo: nuova.tipo, valore: nuova.valore, colore: nuova.colore,
      });
      rollbackSeErrore('aggiungi voce patrimonio', error);
    },

    modificaVocePatrimonio: async (id, aggiornamenti) => {
      set((s) => ({
        patrimonioVoci: s.patrimonioVoci.map((v) => v.id === id ? { ...v, ...aggiornamenti } : v),
      }));
      const dbUpdate: Record<string, unknown> = {};
      if (aggiornamenti.nome   !== undefined) dbUpdate.nome   = aggiornamenti.nome;
      if (aggiornamenti.tipo   !== undefined) dbUpdate.tipo   = aggiornamenti.tipo;
      if (aggiornamenti.valore !== undefined) dbUpdate.valore = aggiornamenti.valore;
      if (aggiornamenti.colore !== undefined) dbUpdate.colore = aggiornamenti.colore;
      const { error } = await supabase.from('patrimonio_voci').update(dbUpdate).eq('id', id);
      rollbackSeErrore('modifica voce patrimonio', error);
    },

    eliminaVocePatrimonio: async (id) => {
      set((s) => ({ patrimonioVoci: s.patrimonioVoci.filter((v) => v.id !== id) }));
      const { error } = await supabase.from('patrimonio_voci').delete().eq('id', id);
      rollbackSeErrore('elimina voce patrimonio', error);
    },

    // Calcola il patrimonio netto corrente (liquidità dai conti + beni manuali − debiti manuali)
    // e lo fotografa per il mese in corso: upsert su patrimonio_storico, così il mese si aggiorna
    // ogni volta che viene ricalcolato ma i mesi passati restano fissi una volta chiuso il mese
    aggiornaSnapshotPatrimonio: async () => {
      const { transazioni, patrimonioVoci } = get();
      const liquidita = transazioni
        .filter((t) => !t.ricorrente)
        .reduce((s, t) => s + (t.tipo === 'entrata' ? t.importo : -t.importo), 0);
      const attivi = patrimonioVoci.filter((v) => v.tipo === 'attivo').reduce((s, v) => s + v.valore, 0);
      const passivi = patrimonioVoci.filter((v) => v.tipo === 'passivo').reduce((s, v) => s + v.valore, 0);
      const totale = liquidita + attivi - passivi;

      const oggi = new Date();
      const chiave = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, '0')}`;

      set((s) => ({
        patrimonioStorico: [
          ...s.patrimonioStorico.filter((sn) => sn.data !== chiave),
          { data: chiave, valore: totale },
        ].sort((a, b) => a.data.localeCompare(b.data)),
      }));
      const { error } = await supabase.from('patrimonio_storico').upsert({ data: chiave, valore: totale });
      rollbackSeErrore('aggiorna snapshot patrimonio', error);
    },
  };
};
