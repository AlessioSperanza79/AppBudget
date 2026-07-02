// ── Sostituto del Text nativo: applica il font di base dell'app a ogni testo ──
// Importato al posto di Text da 'react-native' in tutte le schermate, così l'intera app
// usa Plus Jakarta Sans senza dover toccare le centinaia di stili con fontWeight già esistenti
// (che restano invariati e continuano a fare la loro sintesi di grassetto sopra il nuovo font)
import { Text as TestoNativo, TextProps } from 'react-native';
import { FONT_BASE } from '../constants/tema';

export default function Text({ style, ...resto }: TextProps) {
  return <TestoNativo {...resto} style={[{ fontFamily: FONT_BASE }, style]} />;
}
