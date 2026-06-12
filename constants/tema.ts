import { useColorScheme } from 'react-native';
import { usePreferenze } from '../store/usePreferenze';

// Palette "Mint Horizon": base teal/menta fresca con accenti corallo per le uscite
export const luce = {
  sfondo:         '#F2F7F6',
  carta:          '#FFFFFF',
  superfice:      '#EAF6F3',
  bordo:          '#DCEFEA',
  bordoSottile:   '#ECF7F4',
  titolo:         '#0B1F1C',
  corpo:          '#34504A',
  sottile:        '#6B8A82',
  piuSottile:     '#A3BDB6',
  segnaposto:     '#C8DED8',
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
  toggleSfondo:   '#E3F7F5',
  toggleAttivo:   '#FFFFFF',
  sfondoInput:    '#F3FAF9',
  ombra:          '#0A1F1C',
  gradientePositivo: ['#0EA5A4', '#22D3A5'] as [string, string],
  gradienteNegativo: ['#EF4444', '#F97316'] as [string, string],
};

export const buio = {
  sfondo:         '#0B1614',
  carta:          '#142220',
  superfice:      '#1B2D2A',
  bordo:          '#243C38',
  bordoSottile:   '#1C302D',
  titolo:         '#EAF7F4',
  corpo:          '#C3D9D4',
  sottile:        '#87A29C',
  piuSottile:     '#5E7873',
  segnaposto:     '#3E5550',
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
  toggleSfondo:   '#1B2D2A',
  toggleAttivo:   '#243C38',
  sfondoInput:    '#142220',
  ombra:          '#000000',
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
