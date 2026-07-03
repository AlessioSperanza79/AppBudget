import { View } from 'react-native';
import Text from '../TestoBase';
import { useTema } from '../../constants/tema';
import { formatEuro } from '../../utils/formatters';

export default function RigaFlusso({
  etichetta, importo, reddito, colore,
}: { etichetta: string; importo: number; reddito: number; colore: string }) {
  const t = useTema();
  const perc = Math.min((importo / reddito) * 100, 100);
  return (
    <View style={{ marginBottom: 12, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colore, flexShrink: 0 }} />
        <Text style={{ flex: 1, fontSize: 13, color: t.corpo, fontWeight: '500' }} numberOfLines={1}>
          {etichetta}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colore }}>{formatEuro(importo)}</Text>
        <Text style={{ fontSize: 12, color: t.piuSottile, width: 36, textAlign: 'right' }}>
          {Math.round(perc)}%
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: t.bordoSottile, borderRadius: 3, overflow: 'hidden', marginLeft: 16 }}>
        <View style={{
          height: 6, borderRadius: 3, backgroundColor: colore, opacity: 0.8,
          width: `${perc}%` as `${number}%`,
        }} />
      </View>
    </View>
  );
}
