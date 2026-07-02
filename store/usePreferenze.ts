import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PreferenzaTema = 'sistema' | 'chiaro' | 'scuro';

interface PreferenzeState {
  tema: PreferenzaTema;
  setTema: (t: PreferenzaTema) => void;
  tourCompletato: boolean;
  setTourCompletato: (v: boolean) => void;
  suggerimentiVisti: Record<string, boolean>;
  segnaSuggerimentoVisto: (chiave: string) => void;
  ricercheRecenti: string[];
  aggiungiRicercaRecente: (testo: string) => void;
}

const MAX_RICERCHE_RECENTI = 8;

export const usePreferenze = create<PreferenzeState>()(
  persist(
    (set) => ({
      tema: 'sistema',
      setTema: (tema) => set({ tema }),
      tourCompletato: false,
      setTourCompletato: (tourCompletato) => set({ tourCompletato }),
      suggerimentiVisti: {},
      segnaSuggerimentoVisto: (chiave) =>
        set((s) => ({ suggerimentiVisti: { ...s.suggerimentiVisti, [chiave]: true } })),
      ricercheRecenti: [],
      aggiungiRicercaRecente: (testo) =>
        set((s) => ({
          ricercheRecenti: [testo, ...s.ricercheRecenti.filter((r) => r !== testo)].slice(0, MAX_RICERCHE_RECENTI),
        })),
    }),
    {
      name: 'preferenze-app',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
