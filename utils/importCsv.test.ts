import { parseCsvTransazioni } from './importCsv';
import { Categoria, Istituto } from '../types';

const categorie: Categoria[] = [{ id: 'c1', nome: 'Cibo', colore: '#000', tipo: 'variabile' }];
const istituti: Istituto[] = [{ id: 'i1', nome: 'Revolut' }];

describe('parseCsvTransazioni', () => {
  it('segnala un file vuoto o senza righe di dati', () => {
    const r = parseCsvTransazioni('Data;Importo', categorie, istituti);
    expect(r.errori).toEqual(['Il file è vuoto o privo di righe di dati.']);
  });

  it('segnala intestazioni non riconosciute', () => {
    const r = parseCsvTransazioni('Foo;Bar\n1;2', categorie, istituti);
    expect(r.errori[0]).toMatch(/Intestazioni non riconosciute/);
  });

  it('riconosce data ISO, DD/MM/YYYY e il formato testuale italiano dell\'export', () => {
    const csv = [
      'Data;Categoria;Importo',
      '2026-06-05;Cibo;10',
      '05/06/2026;Cibo;10',
      '5 giu 2026;Cibo;10',
    ].join('\n');
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.errori).toEqual([]);
    expect(r.righe.map((x) => x.data)).toEqual(['2026-06-05', '2026-06-05', '2026-06-05']);
  });

  it('scarta le righe con data non valida mantenendo un messaggio d\'errore', () => {
    const csv = 'Data;Categoria;Importo\nnon-una-data;Cibo;10';
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.righe).toHaveLength(0);
    expect(r.errori[0]).toMatch(/Riga 2: data non valida/);
  });

  it('deduce il tipo dal segno dell\'importo quando la colonna Tipo è assente', () => {
    const csv = 'Data;Categoria;Importo\n2026-06-05;Cibo;-25\n2026-06-05;Cibo;25';
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.righe[0]).toMatchObject({ tipo: 'uscita', importo: 25 });
    expect(r.righe[1]).toMatchObject({ tipo: 'entrata', importo: 25 });
  });

  it('interpreta la virgola come separatore decimale e il punto come migliaia', () => {
    const csv = 'Data;Categoria;Importo\n2026-06-05;Cibo;"1.234,56"';
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.righe[0].importo).toBeCloseTo(1234.56);
  });

  it('scarta le righe con importo pari a zero', () => {
    const csv = 'Data;Categoria;Importo\n2026-06-05;Cibo;0';
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.righe).toHaveLength(0);
    expect(r.errori[0]).toMatch(/importo pari a zero/);
  });

  it('scarta le righe senza categoria e segnala l\'errore', () => {
    const csv = 'Data;Categoria;Importo\n2026-06-05;;10';
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.righe).toHaveLength(0);
    expect(r.errori[0]).toMatch(/categoria mancante/);
  });

  it('rileva le categorie non ancora esistenti', () => {
    const csv = 'Data;Categoria;Importo\n2026-06-05;Viaggi;10';
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.categorieNuove).toEqual(['Viaggi']);
  });

  it('associa l\'istituto per nome, ignorando maiuscole/minuscole', () => {
    const csv = 'Data;Categoria;Importo;Conto\n2026-06-05;Cibo;10;revolut';
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.righe[0].istitutoId).toBe('i1');
  });

  it('gestisce correttamente i campi tra virgolette contenenti il separatore', () => {
    const csv = 'Data;Categoria;Importo;Nota\n2026-06-05;Cibo;10;"Spesa; extra"';
    const r = parseCsvTransazioni(csv, categorie, istituti);
    expect(r.righe[0].nota).toBe('Spesa; extra');
  });
});
