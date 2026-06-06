// ── Schermata Pianificazione: modelli ricorrenti e applicazione mensile ──
import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Transazione } from '../../types';
import { formatEuro } from '../../utils/formatters';
import TransactionItem from '../../components/TransactionItem';
import TransactionForm from '../../components/TransactionForm';
import EmptyState from '../../components/EmptyState';
import { useTema, Tema } from '../../constants/tema';

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export default function PianificazioneScreen() {
  const {
    transazioni, categorie, istituti,
    aggiungiModelloRicorrente, modificaTransazione, eliminaModelloRicorrente,
    applicaRicorrenti,
  } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Riepilogo modelli ── */}
        {ricorrenti.length > 0 && (
          <View style={stili.riepilogo}>
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
          </View>
        )}

        {/* ── Lista modelli ── */}
        <Text style={stili.sezioneLabel}>
          Modelli ({ricorrenti.length})
        </Text>

        {ricorrenti.length === 0 ? (
          <EmptyState
            messaggio={"Nessun modello ricorrente.\nPremi + per aggiungerne uno.\n\nUsa il toggle «Ricorrente» nel form."}
            icona="repeat-outline"
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
          <View style={stili.cardApplica}>
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
              <TouchableOpacity onPress={() => navigaMese(-1)} hitSlop={10} style={stili.btnNav}>
                <Ionicons name="chevron-back" size={18} color={t.sottile} />
              </TouchableOpacity>
              <Text style={stili.labelMese}>{MESI[meseTarget]} {annoTarget}</Text>
              <TouchableOpacity onPress={() => navigaMese(1)} hitSlop={10} style={stili.btnNav}>
                <Ionicons name="chevron-forward" size={18} color={t.sottile} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[stili.btnApplica, applicando && { opacity: 0.6 }]}
              onPress={handleApplica}
              disabled={applicando}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={stili.testoBtnApplica}>
                {applicando ? 'Creazione in corso…' : `Applica ${ricorrentiManuali.length} modell${ricorrentiManuali.length === 1 ? 'o' : 'i'} a ${MESI[meseTarget]}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={stili.fab}
        onPress={() => { setTransazioneSelezionata(undefined); setModaleVisibile(true); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

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
      <Modal visible={!!modelloDaEliminare} transparent animationType="fade">
        <View style={stili.sfondoModal}>
          <View style={stili.cartaModal}>
            <View style={stili.cerchioElimina}>
              <Ionicons name="trash-outline" size={26} color={t.uscita} />
            </View>
            <Text style={stili.titoloModal}>Elimina modello</Text>
            <Text style={stili.testoModal}>
              {transazioni.some((x) => x.templateId === modelloDaEliminare)
                ? 'Eliminare questo modello e tutte le transazioni create da esso?'
                : 'Rimuovere questo modello ricorrente?'}
            </Text>
            <View style={stili.rigaBtnModal}>
              <TouchableOpacity
                style={[stili.btnModal, stili.btnAnnulla]}
                onPress={() => setModelloDaEliminare(undefined)}
              >
                <Text style={stili.testoAnnulla}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[stili.btnModal, stili.btnElimina]}
                onPress={() => {
                  if (modelloDaEliminare) eliminaModelloRicorrente(modelloDaEliminare);
                  setModelloDaEliminare(undefined);
                }}
              >
                <Text style={stili.testoElimina}>Elimina</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Conferma applica ricorrenti ── */}
      <Modal visible={mostraConfermaApplica} transparent animationType="fade">
        <View style={stili.sfondoModal}>
          <View style={stili.cartaModal}>
            <View style={stili.cerchioApplica}>
              <Ionicons name="checkmark-circle-outline" size={26} color={t.primario} />
            </View>
            <Text style={stili.titoloModal}>Applica ricorrenti</Text>
            <Text style={stili.testoModal}>
              {`Creare ${ricorrentiManuali.length} transazion${ricorrentiManuali.length === 1 ? 'e' : 'i'} per ${MESI[meseTarget]} ${annoTarget}?`}
            </Text>
            <View style={stili.rigaBtnModal}>
              <TouchableOpacity
                style={[stili.btnModal, stili.btnAnnulla]}
                onPress={() => setMostraConfermaApplica(false)}
              >
                <Text style={stili.testoAnnulla}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[stili.btnModal, stili.btnApplicaModal]}
                onPress={eseguiApplica}
              >
                <Text style={stili.testoElimina}>Applica</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      borderRadius: 16,
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
      borderRadius: 20,
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
      borderRadius: 20,
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

    // ── Modal conferme ──
    sfondoModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    cartaModal: {
      backgroundColor: t.carta,
      borderRadius: 24,
      padding: 28,
      width: '100%',
      alignItems: 'center',
      gap: 10,
    },
    cerchioElimina: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.uscitaSfondo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cerchioApplica: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.primarioSfondo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titoloModal: {
      fontSize: 17,
      fontWeight: '700',
      color: t.titolo,
      textAlign: 'center',
    },
    testoModal: {
      fontSize: 14,
      color: t.sottile,
      textAlign: 'center',
      lineHeight: 21,
    },
    rigaBtnModal: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
      width: '100%',
    },
    btnModal: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
    },
    btnAnnulla: {
      backgroundColor: t.superfice,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    btnElimina: {
      backgroundColor: t.uscita,
    },
    btnApplicaModal: {
      backgroundColor: t.primario,
    },
    testoAnnulla: {
      fontSize: 15,
      fontWeight: '600',
      color: t.sottile,
    },
    testoElimina: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFF',
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
