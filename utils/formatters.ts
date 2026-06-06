// Funzioni di formattazione usate in tutta l'app

/** Formatta un numero come valuta euro in italiano: 1234.5 → "€ 1.234,50" */
export const formatEuro = (importo: number): string =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(importo);

/** Formatta una data ISO in italiano: "2026-06-05" → "5 giu 2026" */
export const formatData = (dataIso: string): string => {
  // Aggiungere T00:00:00 evita che il browser interpreti la data come UTC
  // e la sposti di un giorno a causa del fuso orario
  const d = new Date(dataIso + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Restituisce la data di oggi in formato ISO "YYYY-MM-DD" */
export const oggiIso = (): string => new Date().toISOString().split('T')[0];
