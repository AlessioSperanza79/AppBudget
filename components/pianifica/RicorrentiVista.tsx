// ── Vista "Ricorrenti" della schermata Pianifica: modelli ricorrenti e applicazione mensile ──
import { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Platform, RefreshControl } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Transazione } from '../../types';
import { formatEuro } from '../../utils/formatters';
import TransactionItem from '../../components/TransactionItem';
import TransactionForm from '../../components/TransactionForm';
import EmptyState from '../../components/EmptyState';
import FadeInView from '../../components/FadeInView';
import PressableScale from '../../components/PressableScale';
import ConfermaDialog from '../../components/ConfermaDialog';
import { useTema, Tema } from '../../constants/tema';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export default function RicorrentiVista() {
  const {
    transazioni, categorie, istituti,
    aggiungiModelloRicorrente, modificaTransazione, eliminaModelloRicorrente,
    applicaRicorrenti,
  } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);
  const { refreshing, onRefresh } = usePullToRefresh();

  const oggi = new Date();
  const [annoTarget, setAnnoTarget] = useState(oggi.getFullYear());
  const [meseTarget, setMeseTarget] = useState(oggi.getMonth());
  const [modaleVisibile, setModaleVisibile]                 = useState(false);
  const [transazioneSelezionata, setTransazioneSelezionata] = useState<Transazione | undefined>();
  const [applicando, setApplicando]                         = useState(false);
  const [modelloDaEliminare, setModelloDaEliminare]         = useState<string | undefined>();
  const [mostraConfermaApplica, setMostraConfermaApplica]   = useState(false);

  const ricorrenti = useMemo(
    () => transazioni.filter((tr) => tr.ricorrente),
    [transazioni],
  );

  // Modelli senza dataFine: richiedono ancora applicazione manuale
  const ricorrentiManuali = useMemo(
    () => ricorrenti.filter((tr) => !tr.dataFine),
    [ricorrenti],
  );

  const totaleEntrate = ricorrenti
    .filter((tr) => tr.tipo === 'entrata')
    .reduce((s, tr) => s + tr.importo, 0);
  const totaleUscite = ricorrenti
    .filter((tr) => tr.tipo === 'uscita')
    .reduce((s, tr) => s + tr.importo, 0);

  const navigaMese = (dir: 1 | -1) => {
    if (dir === 1) {
      if (meseTarget === 11) { setMeseTarget(0); setAnnoTarget((a) => a + 1); }
      else { setMeseTarget((m) => m + 1); }
    } else {
      if (meseTarget === 0) { setMeseTarget(11); setAnnoTarget((a) => a - 1); }
      else { setMeseTarget((m) => m - 1); }
    }
  };

  const handleApplica = () => {
    if (ricorrentiManuali.length === 0) return;
    setMostraConfermaApplica(true);
  };

  const eseguiApplica = async () => {
    setMostraConfermaApplica(false);
    setApplicando(true);
    await applicaRicorrenti(annoTarget, meseTarget);
    setApplicando(false);
  };

  return (
    <View style={stili.contenitore}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primario} colors={[t.primario]} />}
      >

        {/* ── Riepilogo modelli ── */}
        {ricorrenti.length > 0 && (
          <FadeInView style={stili.riepilogo}>
            <View style={[stili.cardRiepilogo, { backgroundColor: t.entrataSfondo }]}>
              <View style={stili.rigaIconaRiep}>
                <Ionicons name="arrow-up-circle-outline" size={16} color={t.entrata} />
                <Text style={[stili.etichettaRiepilogo, { color: t.entrata }]}>Entrate ricorrenti</Text>
              </View>
              <Text style={[stili.valoreRiepilogo, { color: t.entrata }]}>
                +{formatEuro(totaleEntrate)}
              </Text>
            </View>
            <View style={[stili.cardRiepilogo, { backgroundColor: t.uscitaSfondo }]}>
              <View style={stili.rigaIconaRiep}>
                <Ionicons name="arrow-down-circle-outline" size={16} color={t.uscita} />
                <Text style={[stili.etichettaRiepilogo, { color: t.uscita }]}>Uscite ricorrenti</Text>
              </View>
              <Text style={[stili.valoreRiepilogo, { color: t.uscita }]}>
                -{formatEuro(totaleUscite)}
              </Text>
            </View>
          </FadeInView>
        )}

        {/* ── Lista modelli ── */}
        <Text style={stili.sezioneLabel}>
          Modelli ({ricorrenti.length})
        </Text>

        {ricorrenti.length === 0 ? (
          <EmptyState
            messaggio={"Nessun modello ricorrente.\n\nUsa il toggle «Ricorrente» nel form."}
            icona="repeat-outline"
            azioneLabel="Aggiungi ricorrenza"
            onAzione={() => { setTransazioneSelezionata(undefined); setModaleVisibile(true); }}
          />
        ) : (
          <View style={{ marginBottom: 16 }}>
            {ricorrenti.map((tr) => (
              <TransactionItem
                key={tr.id}
                transazione={tr}
                categoria={categorie.find((c) => c.id === tr.categoriaId)}
                istituto={istituti.find((i) => i.id === tr.istitutoId)}
                onModifica={() => { setTransazioneSelezionata(tr); setModaleVisibile(true); }}
                onElimina={() => setModelloDaEliminare(tr.id)}
              />
            ))}
          </View>
        )}

        {/* ── Card applica al mese (solo per modelli senza data fine automatica) ── */}
        {ricorrentiManuali.length > 0 && (
          <FadeInView ritardo={80} style={stili.cardApplica}>
            <View style={stili.intestazioneApplica}>
              <View style={stili.cerchioApplicaIcon}>
                <Ionicons name="calendar-outline" size={18} color={t.primario} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={stili.titoloApplica}>Applica al mese</Text>
                <Text style={stili.descrizioneApplica}>
                  {ricorrentiManuali.length} modell{ricorrentiManuali.length === 1 ? 'o' : 'i'} senza data di fine automatica
                </Text>
              </View>
            </View>

            <View style={stili.navigatore}>
              <PressableScale onPress={() => navigaMese(-1)} hitSlop={10} style={stili.btnNav}>
                <Ionicons name="chevron-back" size={18} color={t.sottile} />
              </PressableScale>
              <Text style={stili.labelMese}>{MESI[meseTarget]} {annoTarget}</Text>
              <PressableScale onPress={() => navigaMese(1)} hitSlop={10} style={stili.btnNav}>
                <Ionicons name="chevron-forward" size={18} color={t.sottile} />
              </PressableScale>
            </View>

            <PressableScale
              style={[stili.btnApplica, applicando && { opacity: 0.6 }]}
              onPress={handleApplica}
              disabled={applicando}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={stili.testoBtnApplica}>
                {applicando ? 'Creazione in corso…' : `Applica ${ricorrentiManuali.length} modell${ricorrentiManuali.length === 1 ? 'o' : 'i'} a ${MESI[meseTarget]}`}
              </Text>
            </PressableScale>
          </FadeInView>
        )}

      </ScrollView>

      {/* ── FAB ── */}
      <PressableScale
        style={stili.fab}
        onPress={() => { setTransazioneSelezionata(undefined); setModaleVisibile(true); }}
        {...suggerimento('Nuovo modello ricorrente')}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </PressableScale>

      <TransactionForm
        visibile={modaleVisibile}
        onChiudi={() => setModaleVisibile(false)}
        onSalva={(dati) => {
          if (transazioneSelezionata) {
            modificaTransazione(transazioneSelezionata.id, dati);
          } else {
            aggiungiModelloRicorrente(dati);
          }
        }}
        transazioneEsistente={transazioneSelezionata}
        categorie={categorie}
        istituti={istituti}
        forzaRicorrente
      />

      {/* ── Conferma eliminazione modello ── */}
      <ConfermaDialog
        visibile={!!modelloDaEliminare}
        onChiudi={() => setModelloDaEliminare(undefined)}
        titolo="Elimina modello"
        messaggio={
          transazioni.some((x) => x.templateId === modelloDaEliminare)
            ? 'Eliminare questo modello e tutte le transazioni create da esso?'
            : 'Rimuovere questo modello ricorrente?'
        }
        onConferma={() => {
          if (modelloDaEliminare) eliminaModelloRicorrente(modelloDaEliminare);
          setModelloDaEliminare(undefined);
        }}
      />

      {/* ── Conferma applica ricorrenti ── */}
      <ConfermaDialog
        visibile={mostraConfermaApplica}
        onChiudi={() => setMostraConfermaApplica(false)}
        titolo="Applica ricorrenti"
        messaggio={`Creare ${ricorrentiManuali.length} transazion${ricorrentiManuali.length === 1 ? 'e' : 'i'} per ${MESI[meseTarget]} ${annoTarget}?`}
        icona="checkmark-circle-outline"
        pericoloso={false}
        testoConferma="Applica"
        onConferma={eseguiApplica}
      />
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },

    // ── Riepilogo sommario ──
    riepilogo: {
      flexDirection: 'row',
      gap: 10,
      margin: 16,
      marginBottom: 4,
    },
    cardRiepilogo: {
      flex: 1,
      borderRadius: 18,
      padding: 14,
      gap: 6,
    },
    rigaIconaRiep: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    etichettaRiepilogo: {
      fontSize: 12,
      fontWeight: '600',
    },
    valoreRiepilogo: {
      fontSize: 18,
      fontWeight: '800',
    },

    // ── Etichetta sezione ──
    sezioneLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 4,
    },

    // ── Card applica ──
    cardApplica: {
      backgroundColor: t.carta,
      margin: 16,
      borderRadius: 24,
      padding: 18,
      gap: 14,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    intestazioneApplica: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cerchioApplicaIcon: {
      width: 40,
      height: 40,
      borderRadius: 24,
      backgroundColor: t.primarioSfondo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titoloApplica: {
      fontSize: 15,
      fontWeight: '700',
      color: t.titolo,
    },
    descrizioneApplica: {
      fontSize: 12,
      color: t.sottile,
      marginTop: 2,
    },
    navigatore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.superfice,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: t.bordoSottile,
    },
    btnNav: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: t.carta,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.bordo,
    },
    labelMese: {
      fontSize: 15,
      fontWeight: '700',
      color: t.titolo,
    },
    btnApplica: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.primario,
      borderRadius: 14,
      paddingVertical: 14,
    },
    testoBtnApplica: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },

    // ── FAB ──
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.viola,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: t.viola,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
  });
}
