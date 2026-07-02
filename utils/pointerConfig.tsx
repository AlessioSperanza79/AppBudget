// Tooltip interattivo condiviso per i LineChart: trascinando il dito sulla linea
// compare un fumetto con il valore del punto toccato (react-native-gifted-charts pointerConfig)
import { View, StyleSheet } from 'react-native';
import Text from '../components/TestoBase';
import { Tema } from '../constants/tema';
import { formatEuro } from './formatters';

interface DatoConEtichetta {
  value: number;
  label?: string;
  etichettaTooltip?: string;
}

export function creaPointerConfig(t: Tema, colore: string, altezzaStriscia: number) {
  return {
    pointerStripHeight: altezzaStriscia,
    pointerStripColor: t.bordo,
    pointerStripWidth: 1.5,
    pointerColor: colore,
    radius: 5,
    activatePointersInstantlyOnTouch: true,
    autoAdjustPointerLabelPosition: true,
    pointerLabelWidth: 110,
    pointerLabelHeight: 46,
    pointerLabelComponent: (items: DatoConEtichetta[]) => {
      const item = items[0];
      const etichetta = item.etichettaTooltip ?? item.label;
      return (
        <View style={[stiliTooltip.contenitore, { backgroundColor: t.carta, borderColor: colore, shadowColor: t.ombra }]}>
          {etichetta ? <Text style={[stiliTooltip.etichetta, { color: t.piuSottile }]}>{etichetta}</Text> : null}
          <Text style={[stiliTooltip.valore, { color: colore }]}>
            {item.value >= 0 ? '+' : ''}{formatEuro(item.value)}
          </Text>
        </View>
      );
    },
  };
}

const stiliTooltip = StyleSheet.create({
  contenitore: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  etichetta: {
    fontSize: 10,
    fontWeight: '600',
  },
  valore: {
    fontSize: 13,
    fontWeight: '700',
  },
});
