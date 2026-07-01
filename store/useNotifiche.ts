import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface NotificheState {
  abilitate: boolean;
  // Chiavi "categoriaId-anno-mese" già notificate, per non ripetere lo stesso avviso più volte
  avvisiBudgetInviati: string[];

  setAbilitate: (v: boolean) => void;
  segnaAvvisoBudgetInviato: (chiave: string) => void;
}

export const useNotifiche = create<NotificheState>()(
  persist(
    (set) => ({
      abilitate: false,
      avvisiBudgetInviati: [],

      setAbilitate: (abilitate) => set({ abilitate }),

      segnaAvvisoBudgetInviato: (chiave) =>
        set((s) =>
          s.avvisiBudgetInviati.includes(chiave)
            ? s
            : { avvisiBudgetInviati: [...s.avvisiBudgetInviati, chiave] }
        ),
    }),
    {
      name: 'notifiche-app',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
