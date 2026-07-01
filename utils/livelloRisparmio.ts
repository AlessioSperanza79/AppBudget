// ── Classifica la % di avanzo sul reddito in 5 livelli, dal migliore al peggiore ──
// Soglie ispirate al 20% di risparmio mensile, un riferimento comune in finanza personale
import { Ionicons } from '@expo/vector-icons';
import { Tema } from '../constants/tema';

type IconaNome = keyof typeof Ionicons.glyphMap;

export interface LivelloRisparmio {
  etichetta: string;
  icona: IconaNome;
  colore: string;
  coloreSfondo: string;
}

export function classificaAvanzo(percentuale: number, t: Tema): LivelloRisparmio {
  if (percentuale >= 25) {
    return { etichetta: 'Eccellente', icona: 'trophy-outline', colore: t.entrata, coloreSfondo: t.entrataSfondo };
  }
  if (percentuale >= 15) {
    return { etichetta: 'Buono', icona: 'thumbs-up-outline', colore: t.primario, coloreSfondo: t.primarioSfondo };
  }
  if (percentuale >= 5) {
    return { etichetta: 'Puoi far meglio', icona: 'trending-up-outline', colore: t.arancio, coloreSfondo: t.arancioSfondo };
  }
  if (percentuale >= 0) {
    return { etichetta: 'Attenzione', icona: 'alert-circle-outline', colore: t.arancio, coloreSfondo: t.arancioSfondo };
  }
  return { etichetta: 'Da correggere', icona: 'close-circle-outline', colore: t.uscita, coloreSfondo: t.uscitaSfondo };
}
