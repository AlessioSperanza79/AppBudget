// ── Sceglie un'icona rappresentativa per una categoria in base al suo nome ──
// Match per parole chiave: più leggibile a colpo d'occhio della sola iniziale del nome
import { Ionicons } from '@expo/vector-icons';

type IconaNome = keyof typeof Ionicons.glyphMap;

const REGOLE: Array<{ parole: string[]; icona: IconaNome }> = [
  { parole: ['stipendio', 'salario', 'lavoro'],                     icona: 'cash-outline' },
  { parole: ['entrata', 'extra', 'bonus', 'rimborso'],              icona: 'trending-up-outline' },
  { parole: ['investimento', 'risparmio', 'obiettivo'],             icona: 'trending-up-outline' },
  { parole: ['cibo', 'spesa', 'supermercato', 'alimentari'],        icona: 'cart-outline' },
  { parole: ['ristorante', 'bar', 'pranzo', 'cena', 'caffè'],       icona: 'restaurant-outline' },
  { parole: ['casa', 'affitto', 'mutuo', 'condominio'],             icona: 'home-outline' },
  { parole: ['trasporti', 'bus', 'treno', 'benzina', 'auto', 'macchina', 'metro'], icona: 'car-outline' },
  { parole: ['salute', 'medico', 'farmacia', 'dentista'],           icona: 'medkit-outline' },
  { parole: ['svago', 'cinema', 'divertimento', 'hobby', 'musica'], icona: 'game-controller-outline' },
  { parole: ['shopping', 'vestiti', 'abbigliamento'],               icona: 'bag-handle-outline' },
  { parole: ['bollette', 'luce', 'gas', 'acqua', 'utenze', 'energia'], icona: 'flash-outline' },
  { parole: ['rata', 'prestito', 'finanziamento', 'moto'],          icona: 'card-outline' },
  { parole: ['assicurazione'],                                      icona: 'shield-checkmark-outline' },
  { parole: ['viaggio', 'vacanza', 'volo', 'hotel'],                icona: 'airplane-outline' },
  { parole: ['scuola', 'universita', 'università', 'corso', 'studio', 'libri'], icona: 'school-outline' },
  { parole: ['palestra', 'sport', 'fitness'],                       icona: 'barbell-outline' },
  { parole: ['telefono', 'internet', 'abbonamento'],                icona: 'wifi-outline' },
  { parole: ['animale', 'cane', 'gatto', 'veterinario'],            icona: 'paw-outline' },
  { parole: ['regalo', 'regali'],                                   icona: 'gift-outline' },
];

const ICONA_PREDEFINITA: IconaNome = 'pricetag-outline';

export function iconaCategoria(nome: string | undefined): IconaNome {
  const testo = (nome ?? '').trim().toLowerCase();
  const regola = REGOLE.find((r) => r.parole.some((p) => testo.includes(p)));
  return regola?.icona ?? ICONA_PREDEFINITA;
}
