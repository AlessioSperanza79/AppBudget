import { calcolaRigheBudget } from './budget';
import { Categoria, Transazione } from '../types';

const categoria = (over: Partial<Categoria> = {}): Categoria => ({
  id: 'c1',
  nome: 'Cibo',
  colore: '#000',
  tipo: 'variabile',
  budgetMensile: 300,
  ...over,
});

const transazione = (over: Partial<Transazione> = {}): Transazione => ({
  id: Math.random().toString(),
  importo: 50,
  tipo: 'uscita',
  categoriaId: 'c1',
  data: '2026-06-15',
  ...over,
});

describe('calcolaRigheBudget', () => {
  it('esclude le categorie senza budget mensile impostato', () => {
    const righe = calcolaRigheBudget([], [categoria({ budgetMensile: undefined })], 2026, 5);
    expect(righe).toHaveLength(0);
  });

  it('somma solo le uscite non ricorrenti della categoria nel mese richiesto', () => {
    const transazioni = [
      transazione({ importo: 100, data: '2026-06-10' }),
      transazione({ importo: 20, data: '2026-06-20' }),
      transazione({ importo: 999, data: '2026-05-10' }), // mese diverso
      transazione({ importo: 999, tipo: 'entrata' }), // tipo diverso
      transazione({ importo: 999, ricorrente: true }), // ricorrente: escluso
      transazione({ importo: 999, categoriaId: 'altra' }), // categoria diversa
    ];
    const [riga] = calcolaRigheBudget(transazioni, [categoria()], 2026, 5); // mese=5 → giugno (0-indexed)
    expect(riga.speso).toBe(120);
    expect(riga.assegnato).toBe(300);
    expect(riga.disponibile).toBe(180);
  });

  it('senza rollover non riporta l\'avanzo del mese precedente', () => {
    const [riga] = calcolaRigheBudget([], [categoria({ rollover: false })], 2026, 5);
    expect(riga.avanzoPrecedente).toBe(0);
    expect(riga.disponibile).toBe(300);
  });

  it('con rollover riporta l\'avanzo (o lo sforamento) del mese precedente', () => {
    const transazioniMesePrecedente = [transazione({ importo: 100, data: '2026-05-10' })];
    const [riga] = calcolaRigheBudget(
      transazioniMesePrecedente,
      [categoria({ rollover: true, budgetMensile: 300 })],
      2026,
      5,
    );
    // maggio: budget 300 applicato retroattivamente - 100 spesi = avanzo di 200
    expect(riga.avanzoPrecedente).toBe(200);
    expect(riga.disponibile).toBe(300 + 200 - 0);
  });

  it('gestisce il cambio anno quando il mese precedente è dicembre', () => {
    const transazioniDicembre = [transazione({ importo: 50, data: '2025-12-10' })];
    const [riga] = calcolaRigheBudget(
      transazioniDicembre,
      [categoria({ rollover: true, budgetMensile: 300 })],
      2026,
      0, // gennaio 2026 → mese precedente è dicembre 2025
    );
    expect(riga.avanzoPrecedente).toBe(250);
  });
});
