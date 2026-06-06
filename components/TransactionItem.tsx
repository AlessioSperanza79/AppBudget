import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transazione, Categoria, Istituto, TipologiaConto } from '../types';
import { formatEuro, formatData } from '../utils/formatters';
import CategoryBadge from './CategoryBadge';

const ICONE_TIPOLOGIA: Record<TipologiaConto, keyof typeof Ionicons.glyphMap> = {
  conto_corrente: 'business-outline',
  carta_credito:  'card-outline',
};

interface Props {
  transazione: Transazione;
  categoria: Categoria | undefined;
  istituto?: Istituto;
  onModifica?: () => void;
  onElimina?: () => void;
  mostraAzioni?: boolean;
}

export default function TransactionItem({
  transazione, categoria, istituto, onModifica, onElimina, mostraAzioni = true,
}: Props) {
  const isEntrata = transazione.tipo === 'entrata';
  const colore = isEntrata ? '#16A34A' : '#DC2626';

  return (
    <View style={[stili.riga, { borderLeftColor: colore }]}>

      {/* Dettagli: categoria, data, istituto, nota */}
      <View style={stili.dettagli}>
        {categoria && <CategoryBadge nome={categoria.nome} colore={categoria.colore} />}
        <Text style={stili.data}>{formatData(transazione.data)}</Text>

        {(istituto || transazione.tipologia) && (
          <View style={stili.rigaIstituto}>
            {transazione.tipologia && (
              <Ionicons name={ICONE_TIPOLOGIA[transazione.tipologia]} size={11} color="#94A3B8" />
            )}
            {istituto && <Text style={stili.testoIstituto}>{istituto.nome}</Text>}
            {transazione.tipologia && !istituto && (
              <Text style={stili.testoIstituto}>
                {transazione.tipologia === 'conto_corrente' ? 'Conto Corrente' : 'Carta di Credito'}
              </Text>
            )}
          </View>
        )}

        {transazione.nota ? (
          <Text style={stili.nota} numberOfLines={1}>{transazione.nota}</Text>
        ) : null}
      </View>

      {/* Importo + pulsanti azione (allineati a destra) */}
      <View style={stili.lato}>
        <Text style={[stili.importo, { color: colore }]}>
          {isEntrata ? '+' : '−'}{formatEuro(transazione.importo)}
        </Text>
        {mostraAzioni && (
          <View style={stili.azioni}>
            {onModifica && (
              <TouchableOpacity onPress={onModifica} hitSlop={8} style={stili.btnAzione}>
                <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
            {onElimina && (
              <TouchableOpacity onPress={onElimina} hitSlop={8} style={stili.btnAzione}>
                <Ionicons name="trash-outline" size={16} color="#FDA4AF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

    </View>
  );
}

const stili = StyleSheet.create({
  riga: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 16,
    padding: 14,
    paddingLeft: 16,
    gap: 12,
    borderLeftWidth: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dettagli: {
    flex: 1,
    gap: 3,
  },
  lato: {
    alignItems: 'flex-end',
    gap: 8,
  },
  importo: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  data: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  rigaIstituto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testoIstituto: {
    fontSize: 11,
    color: '#94A3B8',
  },
  nota: {
    fontSize: 11,
    color: '#CBD5E1',
    fontStyle: 'italic',
  },
  azioni: {
    flexDirection: 'row',
    gap: 2,
  },
  btnAzione: {
    padding: 4,
  },
});
