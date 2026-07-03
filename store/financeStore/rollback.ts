import { FinanceState } from './types';

// Le mutation ottimistiche aggiornano subito lo stato locale; se la scrittura su Supabase
// fallisce, lo stato locale resterebbe disallineato dal DB finché non arriva un refresh —
// questo helper riporta lo stato in linea con la fonte di verità appena si nota l'errore
export const creaRollbackSeErrore = (get: () => FinanceState) =>
  (azione: string, error: { message: string } | null): boolean => {
    if (!error) return false;
    console.error(`[Supabase] ${azione}:`, error.message);
    get().caricaDati();
    return true;
  };
