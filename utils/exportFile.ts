// Versione NATIVA (Android / iOS) — apre il foglio di condivisione di sistema con il contenuto come testo
import { Share } from 'react-native';

export const esportaFile = async (nomeFile: string, contenuto: string, _mimeType: string): Promise<void> => {
  await Share.share({ title: nomeFile, message: contenuto });
};
