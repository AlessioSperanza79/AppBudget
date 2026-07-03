import { generaCsvTransazioni } from './csv';
import { Categoria, Istituto, Transazione } from '../types';

const categorie: Categoria[] = [{ id: 'c1', nome: 'Cibo', colore: '#000', tipo: 'variabile' }];
const istituti: Istituto[] = [{ id: 'i1', nome: 'Revolut' }];

describe('generaCsvTransazioni', () => {
  it('inizia con il BOM UTF-8 e l\'intestazione', () => {
    const csv = generaCsvTransazioni([], [], []);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('Data;Tipo;Categoria;Importo;Nota;Tag;Conto;Tipologia');
  });

  it('applica il segno negativo alle uscite e positivo alle entrate', () => {
    const transazioni: Transazione[] = [
      { id: '1', importo: 50, tipo: 'uscita', categoriaId: 'c1', data: '2026-06-05' },
      { id: '2', importo: 50, tipo: 'entrata', categoriaId: 'c1', data: '2026-06-05' },
    ];
    const csv = generaCsvTransazioni(transazioni, categorie, istituti);
    const righe = csv.split('\n');
    expect(righe[1]).toContain('-50,00');
    expect(righe[2]).toContain('50,00');
    expect(righe[2]).not.toContain('-50,00');
  });

  it('racchiude tra virgolette i campi che contengono il separatore', () => {
    const transazioni: Transazione[] = [
      { id: '1', importo: 10, tipo: 'uscita', categoriaId: 'c1', data: '2026-06-05', nota: 'Pane; latte' },
    ];
    const csv = generaCsvTransazioni(transazioni, categorie, istituti);
    expect(csv).toContain('"Pane; latte"');
  });

  it('raddoppia le virgolette interne al campo', () => {
    const transazioni: Transazione[] = [
      { id: '1', importo: 10, tipo: 'uscita', categoriaId: 'c1', data: '2026-06-05', nota: 'Il "migliore"' },
    ];
    const csv = generaCsvTransazioni(transazioni, categorie, istituti);
    expect(csv).toContain('"Il ""migliore"""');
  });

  it('lascia vuoti i campi opzionali mancanti', () => {
    const transazioni: Transazione[] = [
      { id: '1', importo: 10, tipo: 'uscita', categoriaId: 'sconosciuta', data: '2026-06-05' },
    ];
    const csv = generaCsvTransazioni(transazioni, categorie, istituti);
    const riga = csv.split('\n')[1];
    // Categoria non trovata, nota/tag/conto/tipologia assenti; l'importo contiene una virgola
    // decimale quindi viene racchiuso tra doppi apici da escapeCampo
    expect(riga.split(';')).toEqual([expect.any(String), 'Uscita', '', '"-10,00"', '', '', '', '']);
  });
});
