// Su web le schede non attive restano montate ma senza "display: none" reale (mancando
// react-native-screens), quindi i loro elementi toccabili possono intercettare i tap
// destinati alla scheda visibile in aree senza contenuto opaco sopra (es. spazi vuoti
// di un grafico SVG). pointerEvents="none" quando la scheda perde il focus evita il problema.
import { View, ViewProps } from 'react-native';
import { useIsFocused } from 'expo-router';

export default function ContenitoreScheda({ children, ...resto }: ViewProps) {
  const focalizzata = useIsFocused();
  return (
    <View pointerEvents={focalizzata ? 'auto' : 'none'} {...resto}>
      {children}
    </View>
  );
}
