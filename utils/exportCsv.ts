// Versione NATIVA (Android / iOS) — apre il foglio di condivisione di sistema con il CSV come testo
import { Share } from 'react-native';

export const esportaCsv = async (nomeFile: string, contenuto: string): Promise<void> => {
  await Share.share({ title: nomeFile, message: contenuto });
};
