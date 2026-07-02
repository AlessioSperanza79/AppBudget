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
}

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
    }),
    {
      name: 'preferenze-app',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
