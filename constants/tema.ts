import { useColorScheme } from 'react-native';
import { usePreferenze } from '../store/usePreferenze';

// Font dell'app: base per tutto il testo, "espressivo" per numeri e titoli in evidenza
export const FONT_BASE = 'PlusJakartaSans_400Regular';
export const FONT_ESPRESSIVO = 'PlusJakartaSans_800ExtraBold';

// Palette "Editorial Warm": toni crema/sabbia caldi con accenti teal/menta e corallo,
// evoluzione calda della precedente "Mint Horizon" — le tinte funzionali (entrata/uscita/
// viola/arancio) restano invariate, cambia la scala neutra (sfondi, testi, bordi, ombre)
export const luce = {
  sfondo:         '#FBF7F0',
  carta:          '#FFFFFF',
  superfice:      '#F3ECDF',
  bordo:          '#E8DFCE',
  bordoSottile:   '#F5EEE0',
  titolo:         '#241C10',
  corpo:          '#4A4030',
  sottile:        '#6B5F4A',
  piuSottile:     '#8C806A',
  segnaposto:     '#B3A78E',
  primario:       '#0EA5A4',
  primarioSfondo: '#E3F7F5',
  entrata:        '#0F9D6E',
  entrataSfondo:  '#E7F9F1',
  uscita:         '#E11D48',
  uscitaSfondo:   '#FFF1F3',
  viola:          '#7C3AED',
  violaSfondo:    '#F5F3FF',
  arancio:        '#F97316',
  arancioSfondo:  '#FFF7ED',
  toggleSfondo:   '#F3ECDF',
  toggleAttivo:   '#FFFFFF',
  sfondoInput:    '#FBF6EC',
  ombra:          '#2E2013',
  gradientePositivo: ['#0EA5A4', '#22D3A5'] as [string, string],
  gradienteNegativo: ['#EF4444', '#F97316'] as [string, string],
};

export const buio = {
  sfondo:         '#1B1611',
  carta:          '#241E17',
  superfice:      '#2E2619',
  bordo:          '#3D3324',
  bordoSottile:   '#241D14',
  titolo:         '#F5EFE3',
  corpo:          '#D9CFBC',
  sottile:        '#A99D82',
  piuSottile:     '#8A7F68',
  segnaposto:     '#5E5340',
  primario:       '#2DD4BF',
  primarioSfondo: '#0F3331',
  entrata:        '#34D399',
  entrataSfondo:  '#0E2A20',
  uscita:         '#FB7185',
  uscitaSfondo:   '#2D1418',
  viola:          '#A78BFA',
  violaSfondo:    '#1A1040',
  arancio:        '#FB923C',
  arancioSfondo:  '#2D1800',
  toggleSfondo:   '#2E2619',
  toggleAttivo:   '#3D3324',
  sfondoInput:    '#241E17',
  ombra:          '#150F0A',
  gradientePositivo: ['#0F766E', '#0EA5A4'] as [string, string],
  gradienteNegativo: ['#9F1239', '#E11D48'] as [string, string],
};

export type Tema = typeof luce;

export function useTema(): Tema {
  const schema = useColorScheme();
  const pref = usePreferenze((s) => s.tema);
  const isDark = pref === 'scuro' || (pref === 'sistema' && schema === 'dark');
  return isDark ? buio : luce;
}
