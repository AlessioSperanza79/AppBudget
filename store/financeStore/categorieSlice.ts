import { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import { Categoria, TipoCategoria } from '../../types';
import { FinanceState } from './types';
import { creaRollbackSeErrore } from './rollback';
import { generaId } from './id';

export interface CategorieSlice {
  categorie: Categoria[];
  aggiungiCategoria: (nome: string, colore: string, tipo?: TipoCategoria) => Promise<void>;
  rinominaCategoria: (id: string, nuovoNome: string) => Promise<void>;
  eliminaCategoria: (id: string) => Promise<void>;
  aggiornaBudgetCategoria: (id: string, budget: number | undefined) => Promise<void>;
  aggiornaTipoCategoria: (id: string, tipo: TipoCategoria) => Promise<void>;
  aggiornaRolloverCategoria: (id: string, rollover: boolean) => Promise<void>;
}

export const createCategorieSlice: StateCreator<FinanceState, [], [], CategorieSlice> = (set, get) => {
  const rollbackSeErrore = creaRollbackSeErrore(get);

  return {
    categorie: [],

    aggiungiCategoria: async (nome, colore, tipo = 'variabile') => {
      const nuova: Categoria = { id: generaId(), nome, colore, tipo };
      set((s) => ({ categorie: [...s.categorie, nuova] }));
      const { error } = await supabase.from('categorie').insert({ id: nuova.id, nome: nuova.nome, colore: nuova.colore, tipo: nuova.tipo });
      rollbackSeErrore('aggiungi categoria', error);
    },

    rinominaCategoria: async (id, nuovoNome) => {
      set((s) => ({
        categorie: s.categorie.map((c) => c.id === id ? { ...c, nome: nuovoNome } : c),
      }));
      const { error } = await supabase.from('categorie').update({ nome: nuovoNome }).eq('id', id);
      rollbackSeErrore('rinomina categoria', error);
    },

    eliminaCategoria: async (id) => {
      set((s) => ({ categorie: s.categorie.filter((c) => c.id !== id) }));
      const { error } = await supabase.from('categorie').delete().eq('id', id);
      rollbackSeErrore('elimina categoria', error);
    },

    aggiornaBudgetCategoria: async (id, budget) => {
      set((s) => ({
        categorie: s.categorie.map((c) => c.id === id ? { ...c, budgetMensile: budget } : c),
      }));
      const { error } = await supabase.from('categorie').update({ budget_mensile: budget ?? null }).eq('id', id);
      rollbackSeErrore('aggiorna budget categoria', error);
    },

    aggiornaTipoCategoria: async (id, tipo) => {
      set((s) => ({
        categorie: s.categorie.map((c) => c.id === id ? { ...c, tipo } : c),
      }));
      const { error } = await supabase.from('categorie').update({ tipo }).eq('id', id);
      rollbackSeErrore('aggiorna tipo categoria', error);
    },

    aggiornaRolloverCategoria: async (id, rollover) => {
      set((s) => ({
        categorie: s.categorie.map((c) => c.id === id ? { ...c, rollover } : c),
      }));
      const { error } = await supabase.from('categorie').update({ rollover }).eq('id', id);
      rollbackSeErrore('aggiorna rollover categoria', error);
    },
  };
};
