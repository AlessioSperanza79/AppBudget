// Versione WEB — apre il selettore file del browser tramite un <input type="file"> temporaneo
// Metro sceglie automaticamente questo file quando compila per il web

/** Apre il selettore file e restituisce il contenuto testuale del CSV scelto, o null se annullato */
export const selezionaFileCsv = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
};
