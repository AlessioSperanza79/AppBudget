import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const hashPin = (pin: string): Promise<string> =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);

interface SicurezzaState {
  pinHash: string | null;
  biometriaAttiva: boolean;

  impostaPin: (pin: string) => Promise<void>;
  verificaPin: (pin: string) => Promise<boolean>;
  disattivaBlocco: () => void;
  setBiometriaAttiva: (v: boolean) => void;
}

export const useSicurezza = create<SicurezzaState>()(
  persist(
    (set, get) => ({
      pinHash: null,
      biometriaAttiva: false,

      impostaPin: async (pin) => {
        set({ pinHash: await hashPin(pin) });
      },

      verificaPin: async (pin) => {
        const hash = get().pinHash;
        return hash !== null && hash === (await hashPin(pin));
      },

      disattivaBlocco: () => set({ pinHash: null, biometriaAttiva: false }),

      setBiometriaAttiva: (biometriaAttiva) => set({ biometriaAttiva }),
    }),
    {
      name: 'sicurezza-app',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
