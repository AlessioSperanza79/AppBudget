import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transazione, Categoria, Istituto, TipologiaConto } from '../types';
import { formatEuro, formatData } from '../utils/formatters';
import { useTema, Tema } from '../constants/tema';

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
  onDuplica?: () => void;
  mostraAzioni?: boolean;
}

export default function TransactionItem({
  transazione, categoria, istituto, onModifica, onElimina, onDuplica, mostraAzioni = true,
}: Props) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const isEntrata = transazione.tipo === 'entrata';
  const coloreImporto = isEntrata ? t.entrata : t.uscita;
  const coloreAvatar  = categoria?.colore ?? t.piuSottile;
  const lettAvatar    = (categoria?.nome ?? '?').charAt(0).toUpperCase();

  return (
    <View style={stili.riga}>

      {/* Avatar cerchio con colore categoria e iniziale */}
      <View style={[stili.avatar, { backgroundColor: coloreAvatar }]}>
        <Text style={stili.lettAvatar}>{lettAvatar}</Text>
      </View>

      {/* Dettagli: categoria, data, istituto, nota */}
      <View style={stili.dettagli}>
        <Text style={stili.nomeCategoria} numberOfLines={1}>
          {categoria?.nome ?? '—'}
        </Text>
        <Text style={stili.data}>{formatData(transazione.data)}</Text>

        {(istituto || transazione.tipologia) && (
          <View style={stili.rigaIstituto}>
            {transazione.tipologia && (
              <Ionicons name={ICONE_TIPOLOGIA[transazione.tipologia]} size={11} color={t.piuSottile} />
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

        {transazione.tag ? (
          <View style={stili.chipTag}>
            <Text style={stili.testoTag} numberOfLines={1}>{transazione.tag}</Text>
          </View>
        ) : null}
      </View>

      {/* Importo + pulsanti azione */}
      <View style={stili.lato}>
        <Text style={[stili.importo, { color: coloreImporto }]}>
          {isEntrata ? '+' : '−'}{formatEuro(transazione.importo)}
        </Text>
        {mostraAzioni && (
          <View style={stili.azioni}>
            {onDuplica && (
              <TouchableOpacity onPress={onDuplica} hitSlop={8} style={stili.btnAzione}>
                <Ionicons name="copy-outline" size={15} color={t.piuSottile} />
              </TouchableOpacity>
            )}
            {onModifica && (
              <TouchableOpacity onPress={onModifica} hitSlop={8} style={stili.btnAzione}>
                <Ionicons name="pencil-outline" size={15} color={t.piuSottile} />
              </TouchableOpacity>
            )}
            {onElimina && (
              <TouchableOpacity onPress={onElimina} hitSlop={8} style={stili.btnAzione}>
                <Ionicons name="trash-outline" size={15} color="#FDA4AF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    riga: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 16,
      padding: 14,
      gap: 12,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    lettAvatar: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    dettagli: {
      flex: 1,
      gap: 3,
    },
    nomeCategoria: {
      fontSize: 14,
      fontWeight: '600',
      color: t.titolo,
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
      color: t.piuSottile,
    },
    rigaIstituto: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    testoIstituto: {
      fontSize: 11,
      color: t.piuSottile,
    },
    nota: {
      fontSize: 11,
      color: t.sottile,
      fontStyle: 'italic',
    },
    chipTag: {
      alignSelf: 'flex-start',
      backgroundColor: t.superfice,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 1,
    },
    testoTag: {
      fontSize: 10,
      fontWeight: '600',
      color: t.piuSottile,
    },
    azioni: {
      flexDirection: 'row',
      gap: 2,
    },
    btnAzione: {
      padding: 4,
    },
  });
}
