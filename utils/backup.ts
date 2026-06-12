// Generazione del contenuto JSON per il backup completo dei dati
import { Categoria, Istituto, Obiettivo, Transazione } from '../types';

export interface BackupDati {
  versione: number;
  dataEsportazione: string;
  reddito: number;
  categorie: Categoria[];
  istituti: Istituto[];
  transazioni: Transazione[];
  obiettivi: Obiettivo[];
}

export const generaBackupJson = (
  transazioni: Transazione[],
  categorie: Categoria[],
  istituti: Istituto[],
  reddito: number,
  obiettivi: Obiettivo[],
): string => {
  const backup: BackupDati = {
    versione: 2,
    dataEsportazione: new Date().toISOString(),
    reddito,
    categorie,
    istituti,
    transazioni,
    obiettivi,
  };
  return JSON.stringify(backup, null, 2);
};
