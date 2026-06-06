import { useColorScheme } from 'react-native';

export const luce = {
  sfondo:         '#EEF2F7',
  carta:          '#FFFFFF',
  superfice:      '#F8FAFD',
  bordo:          '#E2EAF4',
  bordoSottile:   '#F0F4F8',
  titolo:         '#050F20',
  corpo:          '#2D3A4D',
  sottile:        '#607182',
  piuSottile:     '#96A5B8',
  segnaposto:     '#C5D2E0',
  primario:       '#2563EB',
  primarioSfondo: '#EEF4FF',
  entrata:        '#15803D',
  entrataSfondo:  '#EDFBF3',
  uscita:         '#DC2626',
  uscitaSfondo:   '#FFF1F2',
  viola:          '#7C3AED',
  violaSfondo:    '#F5F3FF',
  arancio:        '#F97316',
  arancioSfondo:  '#FFF7ED',
  toggleSfondo:   '#E2EAF4',
  toggleAttivo:   '#FFFFFF',
  sfondoInput:    '#F8FAFC',
  ombra:          '#0A1628',
};

export const buio = {
  sfondo:         '#0D1117',
  carta:          '#161B22',
  superfice:      '#1C2128',
  bordo:          '#30363D',
  bordoSottile:   '#21262D',
  titolo:         '#F0F6FC',
  corpo:          '#C9D1D9',
  sottile:        '#8B949E',
  piuSottile:     '#6E7681',
  segnaposto:     '#484F58',
  primario:       '#58A6FF',
  primarioSfondo: '#0D2244',
  entrata:        '#3FB950',
  entrataSfondo:  '#0A2114',
  uscita:         '#F85149',
  uscitaSfondo:   '#2D1417',
  viola:          '#A78BFA',
  violaSfondo:    '#1A1040',
  arancio:        '#FB923C',
  arancioSfondo:  '#2D1800',
  toggleSfondo:   '#21262D',
  toggleAttivo:   '#30363D',
  sfondoInput:    '#161B22',
  ombra:          '#000000',
};

export type Tema = typeof luce;

export function useTema(): Tema {
  const schema = useColorScheme();
  return schema === 'dark' ? buio : luce;
}
