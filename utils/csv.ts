// Generazione del contenuto CSV per l'export delle transazioni
import { Categoria, Istituto, Transazione } from '../types';
import { formatData } from './formatters';

const INTESTAZIONI = ['Data', 'Tipo', 'Categoria', 'Importo', 'Nota', 'Tag', 'Conto', 'Tipologia'];

// Racchiude il campo tra virgolette se contiene virgole, virgolette o a capo
const escapeCampo = (valore: string): string => {
  if (/[",\n;]/.test(valore)) {
    return `"${valore.replace(/"/g, '""')}"`;
  }
  return valore;
};

const TIPOLOGIE_LABEL: Record<string, string> = {
  conto_corrente: 'Conto corrente',
  carta_credito: 'Carta di credito',
};

/** Genera il contenuto CSV (con BOM per Excel) per l'elenco di transazioni fornito */
export const generaCsvTransazioni = (
  transazioni: Transazione[],
  categorie: Categoria[],
  istituti: Istituto[],
): string => {
  const righe = transazioni.map((tr) => {
    const categoria = categorie.find((c) => c.id === tr.categoriaId);
    const istituto = istituti.find((i) => i.id === tr.istitutoId);
    const importo = tr.tipo === 'entrata' ? tr.importo : -tr.importo;
    return [
      formatData(tr.data),
      tr.tipo === 'entrata' ? 'Entrata' : 'Uscita',
      categoria?.nome ?? '',
      importo.toFixed(2).replace('.', ','),
      tr.nota ?? '',
      tr.tag ?? '',
      istituto?.nome ?? '',
      tr.tipologia ? TIPOLOGIE_LABEL[tr.tipologia] ?? '' : '',
    ].map(escapeCampo).join(';');
  });

  // Il BOM (﻿) garantisce che Excel riconosca correttamente l'UTF-8
  return '﻿' + [INTESTAZIONI.join(';'), ...righe].join('\n');
};
