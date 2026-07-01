// ── Ricorda lo sblocco tra un refresh e l'altro della pagina, solo sul web ──
// Su native un "riavvio a freddo" dell'app è un'azione deliberata dell'utente (richiede il PIN);
// sul web invece un refresh è frequente e involontario, quindi non deve richiedere il PIN di nuovo
// finché la scheda del browser resta aperta. sessionStorage si svuota da solo alla chiusura.
import { Platform } from 'react-native';

const CHIAVE = 'appbudget-sbloccato';

export const sessioneGiaSbloccata = (): boolean => {
  if (Platform.OS !== 'web') return false;
  try {
    return window.sessionStorage.getItem(CHIAVE) === '1';
  } catch {
    return false;
  }
};

export const segnaSessioneSbloccata = (): void => {
  if (Platform.OS !== 'web') return;
  try {
    window.sessionStorage.setItem(CHIAVE, '1');
  } catch {
    // Ignora: se sessionStorage non è disponibile si torna semplicemente al comportamento precedente
  }
};
