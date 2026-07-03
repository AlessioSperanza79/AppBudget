import { View } from 'react-native';
import Text from '../TestoBase';
import { useTema } from '../../constants/tema';
import { formatEuro } from '../../utils/formatters';

// Riga di confronto "questo mese vs mese scorso": due barre proporzionali al massimo dei due valori,
// così anche un mese a zero transazioni resta leggibile rispetto all'altro
export default function RigaConfronto({
  etichetta, corrente, precedente, colore,
}: { etichetta: string; corrente: number; precedente: number; colore: string }) {
  const t = useTema();
  const massimo = Math.max(corrente, precedente, 1);
  const percCorrente = Math.min((corrente / massimo) * 100, 100);
  const percPrecedente = Math.min((precedente / massimo) * 100, 100);
  const variazione = precedente > 0 ? ((corrente - precedente) / precedente) * 100 : null;

  return (
    <View style={{ marginBottom: 14, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colore, flexShrink: 0 }} />
        <Text style={{ flex: 1, fontSize: 13, color: t.corpo, fontWeight: '500' }}>{etichetta}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colore }}>{formatEuro(corrente)}</Text>
        {variazione != null && (
          <Text style={{ fontSize: 11, color: t.piuSottile, width: 46, textAlign: 'right' }}>
            {variazione >= 0 ? '+' : ''}{Math.round(variazione)}%
          </Text>
        )}
      </View>
      <View style={{ height: 6, backgroundColor: t.bordoSottile, borderRadius: 3, overflow: 'hidden', marginLeft: 16 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colore, width: `${percCorrente}%` as `${number}%` }} />
      </View>
      <View style={{ height: 6, backgroundColor: t.bordoSottile, borderRadius: 3, overflow: 'hidden', marginLeft: 16 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colore, opacity: 0.35, width: `${percPrecedente}%` as `${number}%` }} />
      </View>
    </View>
  );
}
