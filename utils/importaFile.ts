// Versione NATIVA (Android / iOS) — apre il selettore di documenti di sistema e legge il file scelto
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

/** Apre il selettore file e restituisce il contenuto testuale del CSV scelto, o null se annullato */
export const selezionaFileCsv = async (): Promise<string | null> => {
  const risultato = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
    copyToCacheDirectory: true,
  });
  if (risultato.canceled || !risultato.assets?.[0]) return null;
  return FileSystem.readAsStringAsync(risultato.assets[0].uri);
};
