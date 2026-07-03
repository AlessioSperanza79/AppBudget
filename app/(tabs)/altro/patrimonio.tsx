// ── Sotto-schermata "Patrimonio": patrimonio netto, andamento nel tempo, beni e debiti manuali ──
import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, StyleSheet, Platform, RefreshControl } from 'react-native';
import Text from '../../../components/TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { VocePatrimonio } from '../../../types';
import { useTema, Tema, FONT_ESPRESSIVO } from '../../../constants/tema';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { formatEuro } from '../../../utils/formatters';
import { creaPointerConfig } from '../../../utils/pointerConfig';
import EmptyState from '../../../components/EmptyState';
import PressableScale from '../../../components/PressableScale';
import BottomSheet from '../../../components/BottomSheet';
import ConfermaDialog from '../../../components/ConfermaDialog';

const PALETTE: string[] = [
  '#2563EB', '#15803D', '#F57F17', '#7C3AED',
  '#E53935', '#00838F', '#AD1457', '#6A1B9A',
];

const MESI_BREVI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

interface RigaVoceProps {
  voce: VocePatrimonio;
  t: Tema;
  stili: ReturnType<typeof creaStili>;
  onModifica: () => void;
  onElimina: () => void;
}

function RigaVoce({ voce, t, stili, onModifica, onElimina }: RigaVoceProps) {
  return (
    <View style={stili.rigaVoce}>
      <View style={[stili.pallinoVoce, { backgroundColor: voce.colore }]} />
      <Text style={stili.nomeVoce} numberOfLines={1}>{voce.nome}</Text>
      <Text style={[stili.valoreVoce, { color: voce.tipo === 'attivo' ? t.entrata : t.uscita }]}>
        {formatEuro(voce.valore)}
      </Text>
      <PressableScale onPress={onModifica} style={stili.btnIconaVoce} hitSlop={8}>
        <Ionicons name="pencil-outline" size={16} color={t.primario} />
      </PressableScale>
      <PressableScale onPress={onElimina} style={stili.btnIconaVoce} hitSlop={8}>
        <Ionicons name="trash-outline" size={16} color={t.uscita} />
      </PressableScale>
    </View>
  );
}

export default function PatrimonioScreen() {
  const {
    transazioni, patrimonioVoci, patrimonioStorico,
    aggiungiVocePatrimonio, modificaVocePatrimonio, eliminaVocePatrimonio, aggiornaSnapshotPatrimonio,
  } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);
  const { refreshing, onRefresh } = usePullToRefresh();

  // Fotografa il patrimonio del mese corrente al primo caricamento della schermata,
  // così lo storico si costruisce da solo mese per mese senza bisogno di un'azione manuale
  useEffect(() => { aggiornaSnapshotPatrimonio(); }, []);

  const liquidita = useMemo(
    () => transazioni.filter((tx) => !tx.ricorrente).reduce((s, tx) => s + (tx.tipo === 'entrata' ? tx.importo : -tx.importo), 0),
    [transazioni],
  );
  const attivi = useMemo(() => patrimonioVoci.filter((v) => v.tipo === 'attivo'), [patrimonioVoci]);
  const passivi = useMemo(() => patrimonioVoci.filter((v) => v.tipo === 'passivo'), [patrimonioVoci]);
  const totaleAttivi = attivi.reduce((s, v) => s + v.valore, 0);
  const totalePassivi = passivi.reduce((s, v) => s + v.valore, 0);
  const patrimonioNetto = liquidita + totaleAttivi - totalePassivi;

  const datiStorico = useMemo(() =>
    patrimonioStorico.map((sn) => {
      const mese = Number(sn.data.split('-')[1]);
      return {
        value: sn.valore,
        label: MESI_BREVI[mese - 1],
        labelTextStyle: { fontSize: 9, color: t.piuSottile },
      };
    }),
    [patrimonioStorico, t],
  );
  const coloreStorico = patrimonioNetto >= 0 ? t.primario : t.uscita;

  // ── Modal voce (bene/debito) ──
  const [modaleVisibile, setModaleVisibile]   = useState(false);
  const [voceInModifica, setVoceInModifica]   = useState<VocePatrimonio | undefined>();
  const [nome, setNome]     = useState('');
  const [valore, setValore] = useState('');
  const [tipo, setTipo]     = useState<'attivo' | 'passivo'>('attivo');
  const [colore, setColore] = useState(PALETTE[0]);
  const [voceDaEliminare, setVoceDaEliminare] = useState<VocePatrimonio | undefined>();

  const apriNuova = (tipoIniziale: 'attivo' | 'passivo') => {
    setVoceInModifica(undefined);
    setNome('');
    setValore('');
    setTipo(tipoIniziale);
    setColore(PALETTE[0]);
    setModaleVisibile(true);
  };

  const apriModifica = (voce: VocePatrimonio) => {
    setVoceInModifica(voce);
    setNome(voce.nome);
    setValore(String(voce.valore));
    setTipo(voce.tipo);
    setColore(voce.colore);
    setModaleVisibile(true);
  };

  const salvaVoce = () => {
    const nomeTrim = nome.trim();
    const v = parseFloat(valore.replace(',', '.'));
    if (!nomeTrim || isNaN(v) || v <= 0) return;
    const dati = { nome: nomeTrim, valore: v, tipo, colore };
    if (voceInModifica) modificaVocePatrimonio(voceInModifica.id, dati);
    else aggiungiVocePatrimonio(dati);
    setModaleVisibile(false);
  };

  return (
    <ScrollView
      style={stili.contenitore}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primario} colors={[t.primario]} />}
    >
      {/* ── Card patrimonio netto ── */}
      <View style={stili.cardTotale}>
        <Text style={stili.etichettaTotale}>Patrimonio netto</Text>
        <Text style={[stili.valoreTotale, { color: patrimonioNetto >= 0 ? t.entrata : t.uscita }]}>
          {formatEuro(patrimonioNetto)}
        </Text>
        <View style={stili.rigaScomposizione}>
          <View style={stili.voceScomposizione}>
            <Text style={stili.labelScomposizione}>Liquidità</Text>
            <Text style={stili.valoreScomposizione}>{formatEuro(liquidita)}</Text>
          </View>
          <View style={stili.voceScomposizione}>
            <Text style={stili.labelScomposizione}>Beni</Text>
            <Text style={[stili.valoreScomposizione, { color: t.entrata }]}>+{formatEuro(totaleAttivi)}</Text>
          </View>
          <View style={stili.voceScomposizione}>
            <Text style={stili.labelScomposizione}>Debiti</Text>
            <Text style={[stili.valoreScomposizione, { color: t.uscita }]}>−{formatEuro(totalePassivi)}</Text>
          </View>
        </View>
      </View>

      {/* ── Andamento nel tempo ── */}
      {datiStorico.length > 1 && (
        <View style={stili.sezione}>
          <Text style={stili.titoloSezione}>Andamento nel tempo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={datiStorico}
              width={Math.max(320, datiStorico.length * 48)}
              height={140}
              color={coloreStorico}
              thickness={2}
              areaChart
              startFillColor={coloreStorico}
              endFillColor={coloreStorico}
              startOpacity={0.2}
              endOpacity={0.02}
              dataPointsColor={coloreStorico}
              dataPointsRadius={3}
              hideDataPoints={Platform.OS === 'web'}
              yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
              noOfSections={4}
              rulesColor={t.bordoSottile}
              rulesType="solid"
              disableScroll
              pointerConfig={creaPointerConfig(t, coloreStorico, 140)}
            />
          </ScrollView>
        </View>
      )}

      {/* ── Beni ── */}
      <Text style={stili.sezioneLabel}>Beni ({attivi.length})</Text>
      {attivi.length === 0 ? (
        <EmptyState icona="home-outline" messaggio={'Nessun bene aggiunto.\nEs. casa, auto, conto deposito.'} />
      ) : (
        <View style={stili.listaVoci}>
          {attivi.map((voce) => (
            <RigaVoce key={voce.id} voce={voce} t={t} stili={stili} onModifica={() => apriModifica(voce)} onElimina={() => setVoceDaEliminare(voce)} />
          ))}
        </View>
      )}
      <PressableScale style={stili.btnAggiungi} onPress={() => apriNuova('attivo')}>
        <Ionicons name="add-circle-outline" size={20} color={t.entrata} />
        <Text style={[stili.testoAggiungi, { color: t.entrata }]}>Aggiungi bene</Text>
      </PressableScale>

      {/* ── Debiti ── */}
      <Text style={stili.sezioneLabel}>Debiti ({passivi.length})</Text>
      {passivi.length === 0 ? (
        <EmptyState icona="card-outline" messaggio={'Nessun debito aggiunto.\nEs. mutuo, prestito.'} />
      ) : (
        <View style={stili.listaVoci}>
          {passivi.map((voce) => (
            <RigaVoce key={voce.id} voce={voce} t={t} stili={stili} onModifica={() => apriModifica(voce)} onElimina={() => setVoceDaEliminare(voce)} />
          ))}
        </View>
      )}
      <PressableScale style={stili.btnAggiungi} onPress={() => apriNuova('passivo')}>
        <Ionicons name="add-circle-outline" size={20} color={t.uscita} />
        <Text style={[stili.testoAggiungi, { color: t.uscita }]}>Aggiungi debito</Text>
      </PressableScale>

      {/* ── Modal voce ── */}
      <BottomSheet visibile={modaleVisibile} onChiudi={() => setModaleVisibile(false)} altezza="80%">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={stili.corpoModal} keyboardShouldPersistTaps="handled">
            <Text style={stili.titoloModal}>{voceInModifica ? 'Modifica voce' : 'Nuova voce'}</Text>

            <Text style={stili.etichetta}>Tipo</Text>
            <View style={stili.toggleRiga}>
              {(['attivo', 'passivo'] as const).map((tp) => (
                <TouchableOpacity
                  key={tp}
                  style={[
                    stili.btnToggle,
                    tipo === tp && { backgroundColor: tp === 'attivo' ? t.entrata : t.uscita, borderColor: tp === 'attivo' ? t.entrata : t.uscita },
                  ]}
                  onPress={() => setTipo(tp)}
                >
                  <Text style={[stili.testoToggle, tipo === tp && { color: '#FFF' }]}>
                    {tp === 'attivo' ? 'Bene' : 'Debito'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={stili.etichetta}>Nome</Text>
            <TextInput
              style={stili.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Es. Casa, Auto, Mutuo"
              placeholderTextColor={t.segnaposto}
              returnKeyType="done"
            />

            <Text style={stili.etichetta}>Valore attuale (€)</Text>
            <TextInput
              style={stili.input}
              value={valore}
              onChangeText={setValore}
              placeholder="Es. 150000"
              placeholderTextColor={t.segnaposto}
              keyboardType="decimal-pad"
            />

            <Text style={stili.etichetta}>Colore</Text>
            <View style={stili.griglia}>
              {PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColore(c)}
                  style={[stili.campione, { backgroundColor: c }, colore === c && stili.campioneAttivo]}
                />
              ))}
            </View>

            <View style={stili.rigaBottoni}>
              <TouchableOpacity style={stili.btnAnnulla} onPress={() => setModaleVisibile(false)}>
                <Text style={stili.testoAnnulla}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stili.btnConferma} onPress={salvaVoce}>
                <Text style={stili.testoConferma}>Salva</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ── Conferma elimina ── */}
      <ConfermaDialog
        visibile={!!voceDaEliminare}
        onChiudi={() => setVoceDaEliminare(undefined)}
        titolo="Elimina voce"
        messaggio={
          <>
            {'Vuoi eliminare '}
            <Text style={{ fontWeight: '700' }}>{voceDaEliminare?.nome}</Text>
            {'? Questa azione non può essere annullata.'}
          </>
        }
        onConferma={() => {
          if (voceDaEliminare) eliminaVocePatrimonio(voceDaEliminare.id);
          setVoceDaEliminare(undefined);
        }}
      />
    </ScrollView>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },

    // ── Card totale ──
    cardTotale: {
      backgroundColor: t.carta,
      margin: 16,
      marginBottom: 8,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      gap: 4,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    etichettaTotale: {
      fontSize: 12,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    valoreTotale: {
      fontSize: 30,
      fontWeight: '800',
      fontFamily: FONT_ESPRESSIVO,
      marginBottom: 8,
    },
    rigaScomposizione: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: t.bordoSottile,
      paddingTop: 12,
    },
    voceScomposizione: {
      alignItems: 'center',
      gap: 2,
    },
    labelScomposizione: {
      fontSize: 11,
      color: t.piuSottile,
    },
    valoreScomposizione: {
      fontSize: 14,
      fontWeight: '700',
      color: t.titolo,
    },

    // ── Sezione grafico ──
    sezione: {
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 24,
      padding: 20,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    titoloSezione: {
      fontSize: 15,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 8,
    },

    // ── Etichetta sezione lista ──
    sezioneLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
    },

    // ── Lista voci ──
    listaVoci: {
      backgroundColor: t.carta,
      marginHorizontal: 16,
      borderRadius: 18,
      paddingHorizontal: 14,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 1,
    },
    rigaVoce: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.bordoSottile,
    },
    pallinoVoce: {
      width: 10,
      height: 10,
      borderRadius: 5,
      flexShrink: 0,
    },
    nomeVoce: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: t.titolo,
    },
    valoreVoce: {
      fontSize: 14,
      fontWeight: '700',
    },
    btnIconaVoce: {
      padding: 4,
    },

    // ── Bottone aggiungi ──
    btnAggiungi: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 14,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.bordo,
    },
    testoAggiungi: {
      fontSize: 14,
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
    toggleRiga: {
      flexDirection: 'row',
      gap: 10,
    },
    btnToggle: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    testoToggle: {
      fontSize: 14,
      fontWeight: '600',
      color: t.piuSottile,
    },
    griglia: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 4,
    },
    campione: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    campioneAttivo: {
      borderWidth: 3,
      borderColor: t.titolo,
    },
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
