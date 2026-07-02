// ── Sotto-schermata "Conti & Istituti": CRUD conti/banche collegati alle transazioni ──
import { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, TextInput, StyleSheet, Platform, KeyboardAvoidingView, RefreshControl } from 'react-native';
import Text from '../../../components/TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { Istituto } from '../../../types';
import PressableScale from '../../../components/PressableScale';
import BottomSheet from '../../../components/BottomSheet';
import ConfermaDialog from '../../../components/ConfermaDialog';
import { useTema, Tema } from '../../../constants/tema';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

export default function ContiScreen() {
  const { istituti, transazioni, aggiungiIstituto, rinominaIstituto, eliminaIstituto } = useFinanceStore();
  const { refreshing, onRefresh } = usePullToRefresh();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [modaleIstituto, setModaleIstituto]           = useState(false);
  const [nomeIstituto, setNomeIstituto]               = useState('');
  const [istitutoInModifica, setIstitutoInModifica]   = useState<Istituto | undefined>();

  const [istDaEliminare, setIstDaEliminare]           = useState<Istituto | undefined>();

  const apriNuovoIstituto = () => {
    setIstitutoInModifica(undefined);
    setNomeIstituto('');
    setModaleIstituto(true);
  };

  const apriModificaIstituto = (ist: Istituto) => {
    setIstitutoInModifica(ist);
    setNomeIstituto(ist.nome);
    setModaleIstituto(true);
  };

  const salvaIstituto = () => {
    const nome = nomeIstituto.trim();
    if (!nome) return;
    if (istitutoInModifica) {
      rinominaIstituto(istitutoInModifica.id, nome);
    } else {
      aggiungiIstituto(nome);
    }
    setModaleIstituto(false);
  };

  return (
    <View style={stili.contenitore}>
      <FlatList
        style={stili.lista}
        data={istituti}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primario} colors={[t.primario]} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={stili.riga}>
            <View style={[stili.avatarCategoria, { backgroundColor: t.primario }]}>
              <Ionicons name="business-outline" size={16} color="#FFF" />
            </View>
            <Text style={stili.nome}>{item.nome}</Text>
            <PressableScale onPress={() => apriModificaIstituto(item)} style={stili.btn} hitSlop={8} {...suggerimento('Modifica conto')}>
              <Ionicons name="pencil-outline" size={18} color={t.primario} />
            </PressableScale>
            <PressableScale onPress={() => setIstDaEliminare(item)} style={stili.btn} hitSlop={8} {...suggerimento('Elimina conto')}>
              <Ionicons name="trash-outline" size={18} color={t.uscita} />
            </PressableScale>
          </View>
        )}
        ListFooterComponent={
          <PressableScale style={stili.btnAggiungi} onPress={apriNuovoIstituto}>
            <Ionicons name="add-circle-outline" size={20} color={t.primario} />
            <Text style={stili.testoAggiungi}>Aggiungi istituto</Text>
          </PressableScale>
        }
      />

      {/* ── Modal Istituto ── */}
      <BottomSheet visibile={modaleIstituto} onChiudi={() => setModaleIstituto(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={stili.corpoModal}>
            <Text style={stili.titoloModal}>
              {istitutoInModifica ? 'Rinomina istituto' : 'Nuovo istituto'}
            </Text>
            <Text style={stili.etichetta}>Nome</Text>
            <TextInput
              style={stili.input}
              value={nomeIstituto}
              onChangeText={setNomeIstituto}
              placeholder="Es. Banca Sella"
              placeholderTextColor={t.segnaposto}
              returnKeyType="done"
            />
            <View style={stili.rigaBottoni}>
              <TouchableOpacity style={stili.btnAnnulla} onPress={() => setModaleIstituto(false)}>
                <Text style={stili.testoAnnulla}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stili.btnConferma} onPress={salvaIstituto}>
                <Text style={stili.testoConferma}>Salva</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 24 }} />
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ── Modal conferma elimina istituto ── */}
      {(() => {
        const inUso  = !!istDaEliminare && transazioni.some((tr) => tr.istitutoId === istDaEliminare.id);
        const nTrans = istDaEliminare ? transazioni.filter((tr) => tr.istitutoId === istDaEliminare.id).length : 0;
        return (
          <ConfermaDialog
            visibile={!!istDaEliminare}
            onChiudi={() => setIstDaEliminare(undefined)}
            titolo="Elimina conto"
            messaggio={
              inUso ? (
                <>
                  <Text style={{ fontWeight: '700' }}>{istDaEliminare?.nome}</Text>
                  {` è collegato a ${nTrans} transazion${nTrans === 1 ? 'e' : 'i'} e non può essere eliminato.\n\nRimuovi prima le transazioni collegate.`}
                </>
              ) : (
                <>
                  {'Vuoi eliminare '}
                  <Text style={{ fontWeight: '700' }}>{istDaEliminare?.nome}</Text>
                  {'? Questa azione non può essere annullata.'}
                </>
              )
            }
            onConferma={inUso ? undefined : () => {
              if (istDaEliminare) eliminaIstituto(istDaEliminare.id);
              setIstDaEliminare(undefined);
            }}
          />
        );
      })()}
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },
    lista: {
      flex: 1,
    },

    // ── Lista ──
    riga: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: t.carta,
      borderRadius: 18,
      padding: 14,
      marginBottom: 8,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 1,
    },
    avatarCategoria: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    nome: {
      flex: 1,
      fontSize: 15,
      color: t.titolo,
      fontWeight: '500',
    },
    btn: {
      padding: 4,
    },
    btnAggiungi: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      marginTop: 4,
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.primario,
      backgroundColor: t.primarioSfondo,
    },
    testoAggiungi: {
      color: t.primario,
      fontSize: 15,
      fontWeight: '600',
    },

    // ── Modal ──
    corpoModal: {
      paddingHorizontal: 24,
      paddingTop: 4,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 4,
    },
    etichetta: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      marginTop: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 12,
      padding: 13,
      fontSize: 15,
      color: t.titolo,
      backgroundColor: t.sfondoInput,
    },

    // ── Bottoni modal ──
    rigaBottoni: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    btnAnnulla: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.bordo,
      alignItems: 'center',
    },
    testoAnnulla: {
      color: t.sottile,
      fontSize: 15,
      fontWeight: '600',
    },
    btnConferma: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: t.primario,
      alignItems: 'center',
    },
    testoConferma: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
