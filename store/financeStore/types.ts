// ────────────────────────────────────────────────────────────────────────────
// Tipo dello stato dello store finanziario, condiviso da tutte le slice
// ────────────────────────────────────────────────────────────────────────────
import { Transazione, Categoria, Istituto, TipoCategoria, Obiettivo, VocePatrimonio, SnapshotPatrimonio } from '../../types';

export interface FinanceState {
  transazioni: Transazione[];
  categorie: Categoria[];
  istituti: Istituto[];
  obiettivi: Obiettivo[];
  patrimonioVoci: VocePatrimonio[];
  patrimonioStorico: SnapshotPatrimonio[];
  caricamento: boolean;
  reddito: number; // reddito mensile netto impostato dall'utente

  caricaDati: () => Promise<void>;
  avviaRealtime: () => () => void;

  aggiungiTransazione: (t: Omit<Transazione, 'id'>) => Promise<void>;
  caricaFotoScontrino: (uri: string) => Promise<string | undefined>;
  importaTransazioni: (righe: Omit<Transazione, 'id'>[]) => Promise<void>;
  modificaTransazione: (id: string, aggiornamenti: Partial<Omit<Transazione, 'id'>>) => Promise<void>;
  eliminaTransazione: (id: string) => Promise<void>;
  aggiungiTrasferimento: (dati: {
    importo: number; data: string; nota?: string; tag?: string;
    istitutoOrigineId: string; istitutoDestinazioneId: string;
  }) => Promise<void>;

  aggiungiModelloRicorrente: (dati: Omit<Transazione, 'id'>) => Promise<void>;
  eliminaModelloRicorrente: (id: string) => Promise<void>;

  aggiungiCategoria: (nome: string, colore: string, tipo?: TipoCategoria) => Promise<void>;
  rinominaCategoria: (id: string, nuovoNome: string) => Promise<void>;
  eliminaCategoria: (id: string) => Promise<void>;
  aggiornaBudgetCategoria: (id: string, budget: number | undefined) => Promise<void>;
  aggiornaTipoCategoria: (id: string, tipo: TipoCategoria) => Promise<void>;
  aggiornaRolloverCategoria: (id: string, rollover: boolean) => Promise<void>;

  aggiornaReddito: (r: number) => Promise<void>;

  applicaRicorrenti: (anno: number, mese: number) => Promise<void>;

  aggiungiIstituto: (nome: string) => Promise<void>;
  rinominaIstituto: (id: string, nuovoNome: string) => Promise<void>;
  eliminaIstituto: (id: string) => Promise<void>;

  aggiungiObiettivo: (dati: Omit<Obiettivo, 'id'>) => Promise<void>;
  modificaObiettivo: (id: string, aggiornamenti: Partial<Omit<Obiettivo, 'id'>>) => Promise<void>;
  eliminaObiettivo: (id: string) => Promise<void>;

  aggiungiVocePatrimonio: (dati: Omit<VocePatrimonio, 'id'>) => Promise<void>;
  modificaVocePatrimonio: (id: string, aggiornamenti: Partial<Omit<VocePatrimonio, 'id'>>) => Promise<void>;
  eliminaVocePatrimonio: (id: string) => Promise<void>;
  aggiornaSnapshotPatrimonio: () => Promise<void>;
}
