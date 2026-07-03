import { Categoria, Transazione } from '../types';

// Somma le uscite non ricorrenti di una categoria in un dato mese
function speseCategoriaMese(transazioni: Transazione[], categoriaId: string, anno: number, mese: number): number {
  let totale = 0;
  for (const tr of transazioni) {
    if (tr.tipo !== 'uscita' || tr.ricorrente || tr.categoriaId !== categoriaId) continue;
    const d = new Date(tr.data + 'T00:00:00');
    if (d.getFullYear() === anno && d.getMonth() === mese) totale += tr.importo;
  }
  return totale;
}

export interface RigaBudget {
  categoria: Categoria;
  assegnato: number;
  speso: number;
  avanzoPrecedente: number;
  disponibile: number;
}

// Piano a somma zero per mese: quanto è stato assegnato/speso/disponibile per ogni categoria
// con budget attivo. L'avanzo si guarda un solo mese indietro (non si accumula su più mesi),
// applicando il budget attuale anche al mese precedente: è una stima, non una contabilità
// storica esatta. Condiviso tra BudgetVista (Pianifica) e l'indicatore "Disponibile oggi" (Riepilogo).
export function calcolaRigheBudget(
  transazioni: Transazione[],
  categorie: Categoria[],
  anno: number,
  mese: number,
): RigaBudget[] {
  return categorie
    .filter((c) => (c.budgetMensile ?? 0) > 0)
    .map((cat) => {
      const assegnato = cat.budgetMensile ?? 0;
      const speso = speseCategoriaMese(transazioni, cat.id, anno, mese);

      let avanzoPrecedente = 0;
      if (cat.rollover) {
        let mesePrec = mese - 1, annoPrec = anno;
        if (mesePrec < 0) { mesePrec = 11; annoPrec -= 1; }
        avanzoPrecedente = assegnato - speseCategoriaMese(transazioni, cat.id, annoPrec, mesePrec);
      }

      const disponibileTotale = assegnato + avanzoPrecedente;
      return { categoria: cat, assegnato, speso, avanzoPrecedente, disponibile: disponibileTotale - speso };
    });
}
