import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { View } from 'react-native';
import Text from '../TestoBase';
import { useTema } from '../../constants/tema';
import { Istituto, Transazione, TipologiaConto } from '../../types';
import { formatEuro, formatData } from '../../utils/formatters';

const ICONE_TIPOLOGIA: Record<TipologiaConto, ComponentProps<typeof Ionicons>['name']> = {
  conto_corrente: 'business-outline',
  carta_credito:  'card-outline',
};

// Riga di dettaglio per il popup categoria: mostra subito data, conto, nota e tag —
// niente secondo tap, l'utente ha già chiesto il dettaglio cliccando sulla categoria
export default function RigaDettaglioTransazione({
  transazione, istituto,
}: { transazione: Transazione; istituto?: Istituto }) {
  const t = useTema();
  const isEntrata = transazione.tipo === 'entrata';

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: t.carta, marginHorizontal: 16, marginVertical: 4,
      borderRadius: 14, padding: 12,
      shadowColor: t.ombra, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    }}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: t.titolo }}>{formatData(transazione.data)}</Text>
        {(istituto || transazione.tipologia) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {transazione.tipologia && (
              <Ionicons name={ICONE_TIPOLOGIA[transazione.tipologia]} size={11} color={t.piuSottile} />
            )}
            <Text style={{ fontSize: 11, color: t.piuSottile }}>
              {istituto?.nome ?? (transazione.tipologia === 'conto_corrente' ? 'Conto Corrente' : 'Carta di Credito')}
            </Text>
          </View>
        )}
        {transazione.nota ? (
          <Text style={{ fontSize: 11, color: t.sottile, fontStyle: 'italic' }} numberOfLines={1}>{transazione.nota}</Text>
        ) : null}
        {transazione.tag ? (
          <View style={{ alignSelf: 'flex-start', backgroundColor: t.superfice, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: t.piuSottile }}>{transazione.tag}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: isEntrata ? t.entrata : t.uscita }}>
        {isEntrata ? '+' : '−'}{formatEuro(transazione.importo)}
      </Text>
    </View>
  );
}
