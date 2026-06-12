// Versione WEB — crea un Blob e avvia il download tramite un link temporaneo
// Metro sceglie automaticamente questo file quando compila per il web

export const esportaCsv = async (nomeFile: string, contenuto: string): Promise<void> => {
  const blob = new Blob([contenuto], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeFile;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
