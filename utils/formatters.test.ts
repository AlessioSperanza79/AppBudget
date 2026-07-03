import { formatEuro, formatData, oggiIso } from './formatters';

// L'esatta punteggiatura (es. separatore delle migliaia) dipende dai dati ICU disponibili
// nell'ambiente (Node vs Hermes su device); si verifica solo la sostanza del formato,
// non la stringa esatta, per non avere test fragili tra ambienti diversi.
describe('formatEuro', () => {
  it('include il simbolo euro e i decimali', () => {
    expect(formatEuro(1234.5)).toContain('€');
    expect(formatEuro(1234.5)).toContain('50');
  });

  it('formatta zero con due decimali', () => {
    expect(formatEuro(0)).toContain('0,00');
  });

  it('mantiene il segno negativo', () => {
    expect(formatEuro(-50)).toContain('-');
  });
});

describe('formatData', () => {
  it('formatta una data ISO in italiano senza spostare il giorno per fuso orario', () => {
    expect(formatData('2026-06-05')).toBe('5 giu 2026');
  });

  it('gestisce correttamente il primo giorno del mese', () => {
    expect(formatData('2026-01-01')).toBe('1 gen 2026');
  });
});

describe('oggiIso', () => {
  it('restituisce una data nel formato YYYY-MM-DD', () => {
    expect(oggiIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
