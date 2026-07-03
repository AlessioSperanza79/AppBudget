import { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import { Istituto } from '../../types';
import { FinanceState } from './types';
import { creaRollbackSeErrore } from './rollback';
import { generaId } from './id';

export interface IstitutiSlice {
  istituti: Istituto[];
  aggiungiIstituto: (nome: string) => Promise<void>;
  rinominaIstituto: (id: string, nuovoNome: string) => Promise<void>;
  eliminaIstituto: (id: string) => Promise<void>;
}

export const createIstitutiSlice: StateCreator<FinanceState, [], [], IstitutiSlice> = (set, get) => {
  const rollbackSeErrore = creaRollbackSeErrore(get);

  return {
    istituti: [],

    aggiungiIstituto: async (nome) => {
      const nuovo: Istituto = { id: generaId(), nome };
      set((s) => ({ istituti: [...s.istituti, nuovo] }));
      const { error } = await supabase.from('istituti').insert(nuovo);
      rollbackSeErrore('aggiungi istituto', error);
    },

    rinominaIstituto: async (id, nuovoNome) => {
      set((s) => ({
        istituti: s.istituti.map((i) => i.id === id ? { ...i, nome: nuovoNome } : i),
      }));
      const { error } = await supabase.from('istituti').update({ nome: nuovoNome }).eq('id', id);
      rollbackSeErrore('rinomina istituto', error);
    },

    eliminaIstituto: async (id) => {
      set((s) => ({ istituti: s.istituti.filter((i) => i.id !== id) }));
      const { error } = await supabase.from('istituti').delete().eq('id', id);
      rollbackSeErrore('elimina istituto', error);
    },
  };
};
