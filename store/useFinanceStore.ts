import { create } from 'zustand';
import { FinanceState } from './financeStore/types';
import { createCoreSlice } from './financeStore/coreSlice';
import { createTransazioniSlice } from './financeStore/transazioniSlice';
import { createCategorieSlice } from './financeStore/categorieSlice';
import { createIstitutiSlice } from './financeStore/istitutiSlice';
import { createObiettiviSlice } from './financeStore/obiettiviSlice';
import { createPatrimonioSlice } from './financeStore/patrimonioSlice';

// ────────────────────────────────────────────────────────────────────────────
// Store: Supabase come fonte di verità, stato locale per reattività UI.
// Diviso in slice per dominio (store/financeStore/*) e ricombinato qui via
// spread, così l'API pubblica resta un unico hook `useFinanceStore`.
// ────────────────────────────────────────────────────────────────────────────
export const useFinanceStore = create<FinanceState>()((...a) => ({
  ...createCoreSlice(...a),
  ...createTransazioniSlice(...a),
  ...createCategorieSlice(...a),
  ...createIstitutiSlice(...a),
  ...createObiettiviSlice(...a),
  ...createPatrimonioSlice(...a),
}));
