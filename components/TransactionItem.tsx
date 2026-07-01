import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Transazione, Categoria, Istituto, TipologiaConto } from '../types';
import { formatEuro, formatData } from '../utils/formatters';
import { iconaCategoria } from '../utils/iconeCategorie';
import { useTema, Tema } from '../constants/tema';

const ICONE_TIPOLOGIA: Record<TipologiaConto, keyof typeof Ionicons.glyphMap> = {
  conto_corrente: 'business-outline',
  carta_credito:  'card-outline',
};

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

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

  const contenuto = (
    <View style={stili.riga}>

      {/* Avatar cerchio con colore e icona rappresentativa della categoria */}
      <View style={[stili.avatar, { backgroundColor: coloreAvatar }]}>
        <Ionicons name={iconaCategoria(categoria?.nome)} size={19} color="#FFFFFF" />
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
        {mostraAzioni && Platform.OS === 'web' && (
          <View style={stili.azioni}>
            {onDuplica && (
              <TouchableOpacity onPress={onDuplica} hitSlop={8} style={stili.btnAzione} {...suggerimento('Duplica transazione')}>
                <Ionicons name="copy-outline" size={15} color={t.piuSottile} />
              </TouchableOpacity>
            )}
            {onModifica && (
              <TouchableOpacity onPress={onModifica} hitSlop={8} style={stili.btnAzione} {...suggerimento('Modifica transazione')}>
                <Ionicons name="pencil-outline" size={15} color={t.piuSottile} />
              </TouchableOpacity>
            )}
            {onElimina && (
              <TouchableOpacity onPress={onElimina} hitSlop={8} style={stili.btnAzione} {...suggerimento('Elimina transazione')}>
                <Ionicons name="trash-outline" size={15} color="#FDA4AF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

    </View>
  );

  // Su web il gesto di swipe non è naturale: si mantengono i pulsanti azione visibili
  if (!mostraAzioni || Platform.OS === 'web') return contenuto;

  return (
    <Swipeable
      friction={2}
      rightThreshold={40}
      containerStyle={stili.involucroSwipe}
      renderRightActions={(_progress, _translation, swipeable) => (
        <AzioniSwipe t={t} swipeable={swipeable} onDuplica={onDuplica} onModifica={onModifica} onElimina={onElimina} />
      )}
    >
      {contenuto}
    </Swipeable>
  );
}

// Pannello di azioni rivelato dallo swipe verso sinistra (solo native)
function AzioniSwipe({
  t, swipeable, onDuplica, onModifica, onElimina,
}: {
  t: Tema;
  swipeable: SwipeableMethods;
  onDuplica?: () => void;
  onModifica?: () => void;
  onElimina?: () => void;
}) {
  const stili = useMemo(() => creaStili(t), [t]);

  const esegui = (azione?: () => void) => () => {
    swipeable.close();
    azione?.();
  };

  return (
    <View style={stili.azioniSwipe}>
      {onDuplica && (
        <TouchableOpacity style={[stili.btnSwipe, { backgroundColor: t.violaSfondo }]} onPress={esegui(onDuplica)}>
          <Ionicons name="copy-outline" size={20} color={t.viola} />
        </TouchableOpacity>
      )}
      {onModifica && (
        <TouchableOpacity style={[stili.btnSwipe, { backgroundColor: t.primarioSfondo }]} onPress={esegui(onModifica)}>
          <Ionicons name="pencil-outline" size={20} color={t.primario} />
        </TouchableOpacity>
      )}
      {onElimina && (
        <TouchableOpacity style={[stili.btnSwipe, stili.btnSwipeUltimo, { backgroundColor: t.uscitaSfondo }]} onPress={esegui(onElimina)}>
          <Ionicons name="trash-outline" size={20} color={t.uscita} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    involucroSwipe: {
      marginHorizontal: 16,
      marginVertical: 4,
    },
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

    // ── Azioni swipe (native) ──
    azioniSwipe: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      marginVertical: 4,
      gap: 6,
      paddingLeft: 6,
    },
    btnSwipe: {
      width: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnSwipeUltimo: {
      marginRight: 16,
    },
  });
}
