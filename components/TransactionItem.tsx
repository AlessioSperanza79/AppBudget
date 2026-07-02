import { useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Text from './TestoBase';
import { Ionicons } from '@expo/vector-icons';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Transazione, Categoria, Istituto, TipologiaConto } from '../types';
import { formatEuro, formatData } from '../utils/formatters';
import { iconaCategoria } from '../utils/iconeCategorie';
import { useTema, Tema, FONT_ESPRESSIVO } from '../constants/tema';
import BottomSheet from './BottomSheet';

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

  const [dettagliAperti, setDettagliAperti] = useState(false);

  const isEntrata = transazione.tipo === 'entrata';
  const coloreImporto = isEntrata ? t.entrata : t.uscita;
  const coloreAvatar  = categoria?.colore ?? t.piuSottile;

  // Riga compatta: solo categoria e importo. Il resto (data, conto, nota, tag, azioni)
  // vive nel popup di dettaglio, aperto al tap — evita liste dense e illeggibili
  const contenuto = (
    <TouchableOpacity activeOpacity={0.7} style={stili.riga} onPress={() => setDettagliAperti(true)}>
      <View style={[stili.avatar, { backgroundColor: coloreAvatar }]}>
        <Ionicons name={iconaCategoria(categoria?.nome)} size={19} color="#FFFFFF" />
      </View>
      <Text style={stili.nomeCategoria} numberOfLines={1}>
        {categoria?.nome ?? '—'}
      </Text>
      <Text style={[stili.importo, { color: coloreImporto }]}>
        {isEntrata ? '+' : '−'}{formatEuro(transazione.importo)}
      </Text>
    </TouchableOpacity>
  );

  const azione = (fn?: () => void) => () => {
    setDettagliAperti(false);
    fn?.();
  };

  const dettagli = (
    <BottomSheet visibile={dettagliAperti} onChiudi={() => setDettagliAperti(false)}>
      <View style={stili.corpoModal}>
        <View style={[stili.avatarGrande, { backgroundColor: coloreAvatar }]}>
          <Ionicons name={iconaCategoria(categoria?.nome)} size={28} color="#FFFFFF" />
        </View>
        <Text style={stili.categoriaModal}>{categoria?.nome ?? '—'}</Text>
        <Text style={[stili.importoModal, { color: coloreImporto }]}>
          {isEntrata ? '+' : '−'}{formatEuro(transazione.importo)}
        </Text>

        <View style={stili.listaDettagli}>
          <View style={stili.rigaDettaglio}>
            <Ionicons name="calendar-outline" size={17} color={t.piuSottile} />
            <Text style={stili.testoDettaglio}>{formatData(transazione.data)}</Text>
          </View>

          {(istituto || transazione.tipologia) && (
            <View style={stili.rigaDettaglio}>
              <Ionicons
                name={transazione.tipologia ? ICONE_TIPOLOGIA[transazione.tipologia] : 'business-outline'}
                size={17}
                color={t.piuSottile}
              />
              <Text style={stili.testoDettaglio}>
                {istituto?.nome ?? (transazione.tipologia === 'conto_corrente' ? 'Conto Corrente' : 'Carta di Credito')}
              </Text>
            </View>
          )}

          {transazione.nota ? (
            <View style={stili.rigaDettaglio}>
              <Ionicons name="document-text-outline" size={17} color={t.piuSottile} />
              <Text style={stili.testoDettaglio}>{transazione.nota}</Text>
            </View>
          ) : null}

          {transazione.tag ? (
            <View style={stili.chipTag}>
              <Text style={stili.testoTag}>{transazione.tag}</Text>
            </View>
          ) : null}
        </View>

        {mostraAzioni && (onDuplica || onModifica || onElimina) && (
          <View style={stili.rigaAzioniModal}>
            {onDuplica && (
              <TouchableOpacity style={stili.btnAzioneModal} onPress={azione(onDuplica)}>
                <Ionicons name="copy-outline" size={18} color={t.viola} />
                <Text style={[stili.testoBtnAzioneModal, { color: t.viola }]}>Duplica</Text>
              </TouchableOpacity>
            )}
            {onModifica && (
              <TouchableOpacity style={stili.btnAzioneModal} onPress={azione(onModifica)}>
                <Ionicons name="pencil-outline" size={18} color={t.primario} />
                <Text style={[stili.testoBtnAzioneModal, { color: t.primario }]}>Modifica</Text>
              </TouchableOpacity>
            )}
            {onElimina && (
              <TouchableOpacity style={stili.btnAzioneModal} onPress={azione(onElimina)}>
                <Ionicons name="trash-outline" size={18} color={t.uscita} />
                <Text style={[stili.testoBtnAzioneModal, { color: t.uscita }]}>Elimina</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </BottomSheet>
  );

  // Su web il gesto di swipe non è naturale: si mantiene solo il tap per aprire i dettagli
  if (!mostraAzioni || Platform.OS === 'web') {
    return (
      <>
        {contenuto}
        {dettagli}
      </>
    );
  }

  return (
    <>
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
      {dettagli}
    </>
  );
}

// Pannello di azioni rivelato dallo swipe verso sinistra (solo native) — scorciatoia rapida,
// resta disponibile accanto al popup di dettaglio aperto dal tap sulla riga
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
      borderRadius: 18,
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
    nomeCategoria: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: t.titolo,
    },
    importo: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.3,
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
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnSwipeUltimo: {
      marginRight: 16,
    },

    // ── Popup di dettaglio ──
    corpoModal: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 4,
      paddingBottom: 28,
    },
    avatarGrande: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    categoriaModal: {
      fontSize: 16,
      fontWeight: '700',
      color: t.titolo,
    },
    importoModal: {
      fontSize: 26,
      fontWeight: '700',
      fontFamily: FONT_ESPRESSIVO,
      letterSpacing: -0.5,
      marginTop: 4,
    },
    listaDettagli: {
      alignSelf: 'stretch',
      gap: 14,
      marginTop: 22,
    },
    rigaDettaglio: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    testoDettaglio: {
      flex: 1,
      fontSize: 14,
      color: t.corpo,
    },
    chipTag: {
      alignSelf: 'flex-start',
      backgroundColor: t.superfice,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    testoTag: {
      fontSize: 12,
      fontWeight: '600',
      color: t.piuSottile,
    },
    rigaAzioniModal: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      justifyContent: 'space-around',
      marginTop: 26,
      paddingTop: 18,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.bordo,
    },
    btnAzioneModal: {
      alignItems: 'center',
      gap: 4,
    },
    testoBtnAzioneModal: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
}
