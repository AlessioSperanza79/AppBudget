// ────────────────────────────────────────────────────────────────────────────
// Tipi condivisi in tutta l'app
// ────────────────────────────────────────────────────────────────────────────

/** Un'entrata porta soldi IN; un'uscita porta soldi FUORI */
export type TipoTransazione = 'entrata' | 'uscita';

/** Tipologia di conto/strumento di pagamento */
export type TipologiaConto = 'conto_corrente' | 'carta_credito';

/** Classificazione della categoria nel cruscotto flusso mensile */
export type TipoCategoria = 'fissa' | 'variabile' | 'investimento';

/** Una categoria (es. "Cibo", "Stipendio") con il suo colore di visualizzazione */
export interface Categoria {
  id: string;
  nome: string;
  colore: string; // colore esadecimale, es. "#E53935"
  budgetMensile?: number; // limite di spesa mensile (solo uscite)
  tipo: TipoCategoria; // classificazione per il cruscotto flusso
}

/** Un istituto bancario o conto (es. "Revolut", "Intesa Sanpaolo") */
export interface Istituto {
  id: string;
  nome: string;
}

/** Una singola transazione finanziaria */
export interface Transazione {
  id: string;
  importo: number;          // sempre positivo; il segno viene calcolato dal tipo
  tipo: TipoTransazione;
  categoriaId: string;      // riferimento all'id di una Categoria
  data: string;             // formato ISO "YYYY-MM-DD", es. "2026-06-05"
  nota?: string;            // nota facoltativa
  tag?: string;             // etichetta libera per raggruppare/filtrare (es. "Vacanze")
  tipologia?: TipologiaConto; // conto corrente o carta di credito (opzionale)
  istitutoId?: string;      // riferimento all'id di un Istituto (opzionale)
  ricorrente?: boolean;     // true = modello template in Pianificazione
  dataFine?: string;        // solo sui modelli ricorrenti: data fine ripetizione "YYYY-MM-DD"
  templateId?: string;      // sulle transazioni auto-create: id del modello padre
}
