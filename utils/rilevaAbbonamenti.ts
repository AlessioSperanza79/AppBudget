import { Transazione } from '../types';

export interface CandidatoAbbonamento {
  chiave: string; // categoriaId + nota normalizzata, usata come key React
  nota: string;
  categoriaId: string;
  importoMedio: number;
  occorrenze: number;
  ultimaData: string;
}

const OCCORRENZE_MINIME = 3;
const MESI_CONSIDERATI = 6;
const INTERVALLO_MIN_GIORNI = 25;
const INTERVALLO_MAX_GIORNI = 35;
const TOLLERANZA_IMPORTO = 0.15; // ±15% rispetto alla media del gruppo

const normalizza = (nota: string) => nota.trim().toLowerCase();

// Individua spese "manuali" che si ripetono con cadenza e importo simile a un abbonamento,
// così l'utente può marcarle come ricorrenti invece di inserirle ogni mese a mano.
// Euristica volutamente semplice: raggruppa per categoria+nota esatta (non serve fuzzy
// matching, chi inserisce a mano di solito scrive sempre la stessa nota), poi verifica che
// la maggioranza degli intervalli tra le date cada in una finestra mensile e che gli importi
// non si discostino troppo dalla media del gruppo.
export function rilevaAbbonamenti(transazioni: Transazione[]): CandidatoAbbonamento[] {
  const oggi = new Date();
  const sogliaData = new Date(oggi.getFullYear(), oggi.getMonth() - MESI_CONSIDERATI, oggi.getDate());
  const sogliaIso = sogliaData.toISOString().slice(0, 10);

  // Non suggerire abbonamenti già gestiti come modello ricorrente (stessa categoria+nota)
  const modelliEsistenti = new Set(
    transazioni
      .filter((t) => t.ricorrente && t.nota)
      .map((t) => `${t.categoriaId}::${normalizza(t.nota!)}`),
  );

  const candidate = transazioni.filter((t) =>
    !t.ricorrente && !t.trasferimento && t.tipo === 'uscita' && !!t.nota?.trim() && t.data >= sogliaIso,
  );

  const gruppi = new Map<string, Transazione[]>();
  for (const t of candidate) {
    const chiave = `${t.categoriaId}::${normalizza(t.nota!)}`;
    if (modelliEsistenti.has(chiave)) continue;
    const lista = gruppi.get(chiave) ?? [];
    lista.push(t);
    gruppi.set(chiave, lista);
  }

  const risultati: CandidatoAbbonamento[] = [];
  for (const [chiave, lista] of gruppi) {
    if (lista.length < OCCORRENZE_MINIME) continue;
    const ordinate = [...lista].sort((a, b) => a.data.localeCompare(b.data));

    const intervalli: number[] = [];
    for (let i = 1; i < ordinate.length; i++) {
      const giorni = (new Date(ordinate[i].data + 'T00:00:00').getTime() - new Date(ordinate[i - 1].data + 'T00:00:00').getTime()) / 86400000;
      intervalli.push(giorni);
    }
    const intervalliRegolari = intervalli.filter((g) => g >= INTERVALLO_MIN_GIORNI && g <= INTERVALLO_MAX_GIORNI).length;
    if (intervalliRegolari < Math.ceil(intervalli.length / 2)) continue;

    const importoMedio = ordinate.reduce((s, t) => s + t.importo, 0) / ordinate.length;
    const importiRegolari = importoMedio > 0 && ordinate.every((t) => Math.abs(t.importo - importoMedio) <= importoMedio * TOLLERANZA_IMPORTO);
    if (!importiRegolari) continue;

    risultati.push({
      chiave,
      nota: ordinate[ordinate.length - 1].nota!.trim(),
      categoriaId: ordinate[0].categoriaId,
      importoMedio,
      occorrenze: ordinate.length,
      ultimaData: ordinate[ordinate.length - 1].data,
    });
  }

  return risultati.sort((a, b) => b.occorrenze - a.occorrenze);
}
