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

  const oggi = new Date();
  const [annoTarget, setAnnoTarget] = useState(oggi.getFullYear());
  const [meseTarget, setMeseTarget] = useState(oggi.getMonth());
  const [modaleVisibile, setModaleVisibile]                 = useState(false);
  const [transazioneSelezionata, setTransazioneSelezionata] = useState<Transazione | undefined>();
  const [applicando, setApplicando]                         = useState(false);
  const [modelloDaEliminare, setModelloDaEliminare]         = useState<string | undefined>();
  const [mostraConfermaApplica, setMostraConfermaApplica]   = useState(false);

  const ricorrenti = useMemo(
    () => transazioni.filter((t) => t.ricorrente),
    [transazioni],
  );

  // Modelli senza dataFine: richiedono ancora applicazione manuale
  const ricorrentiManuali = useMemo(
    () => ricorrenti.filter((t) => !t.dataFine),
    [ricorrenti],
  );

  const totaleEntrate = ricorrenti
    .filter((t) => t.tipo === 'entrata')
    .reduce((s, t) => s + t.importo, 0);
  const totaleUscite = ricorrenti
    .filter((t) => t.tipo === 'uscita')
    .reduce((s, t) => s + t.importo, 0);

  const navigaMese = (dir: 1 | -1) => {
    if (dir === 1) {
      if (meseTarget === 11) { setMeseTarget(0); setAnnoTarget((a) => a + 1); }
      else { setMeseTarget((m) => m + 1); }
    } else {
      if (meseTarget === 0) { setMeseTarget(11); setAnnoTarget((a) => a - 1); }
      else { setMeseTarget((m) => m - 1); }
    }
  };

  const confermaElimina = (id: string) => {
    setModelloDaEliminare(id);
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
            <View style={[stili.cardRiepilogo, { backgroundColor: '#DCFCE7' }]}>
              <Text style={stili.etichettaRiepilogo}>Entrate ricorrenti</Text>
              <Text style={[stili.valoreRiepilogo, { color: '#16A34A' }]}>
                +{formatEuro(totaleEntrate)}
              </Text>
            </View>
            <View style={[stili.cardRiepilogo, { backgroundColor: '#FEE2E2' }]}>
              <Text style={stili.etichettaRiepilogo}>Uscite ricorrenti</Text>
              <Text style={[stili.valoreRiepilogo, { color: '#DC2626' }]}>
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
            {ricorrenti.map((t) => (
              <TransactionItem
                key={t.id}
                transazione={t}
                categoria={categorie.find((c) => c.id === t.categoriaId)}
                istituto={istituti.find((i) => i.id === t.istitutoId)}
                onModifica={() => { setTransazioneSelezionata(t); setModaleVisibile(true); }}
                onElimina={() => confermaElimina(t.id)}
              />
            ))}
          </View>
        )}

        {/* ── Card applica al mese (solo per modelli senza data fine automatica) ── */}
        {ricorrentiManuali.length > 0 && (
          <View style={stili.cardApplica}>
            <Text style={stili.titoloApplica}>Applica al mese</Text>
            <Text style={stili.descrizioneApplica}>
              {ricorrentiManuali.length} modell{ricorrentiManuali.length === 1 ? 'o senza' : 'i senza'} data di fine automatica — crea le transazioni per il mese selezionato
            </Text>

            <View style={stili.navigatore}>
              <TouchableOpacity onPress={() => navigaMese(-1)} hitSlop={10}>
                <Ionicons name="chevron-back" size={20} color="#475569" />
              </TouchableOpacity>
              <Text style={stili.labelMese}>{MESI[meseTarget]} {annoTarget}</Text>
              <TouchableOpacity onPress={() => navigaMese(1)} hitSlop={10}>
                <Ionicons name="chevron-forward" size={20} color="#475569" />
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
      >
        <Ionicons name="add" size={30} color="#FFF" />
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
              <Ionicons name="trash-outline" size={28} color="#DC2626" />
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
              <Ionicons name="checkmark-circle-outline" size={28} color="#2563EB" />
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

const stili = StyleSheet.create({
  contenitore: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Riepilogo sommario ──
  riepilogo: {
    flexDirection: 'row',
    gap: 8,
    margin: 16,
    marginBottom: 4,
  },
  cardRiepilogo: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  etichettaRiepilogo: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  valoreRiepilogo:    { fontSize: 15, fontWeight: '700' },

  // ── Etichetta sezione ──
  sezioneLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },

  // ── Card applica ──
  cardApplica: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  titoloApplica: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  descrizioneApplica: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  navigatore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  labelMese: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  btnApplica: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartaModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    gap: 12,
  },
  cerchioElimina: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cerchioApplica: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titoloModal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  testoModal: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  rigaBtnModal: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    width: '100%',
  },
  btnModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnAnnulla: {
    backgroundColor: '#F1F5F9',
  },
  btnElimina: {
    backgroundColor: '#DC2626',
  },
  btnApplicaModal: {
    backgroundColor: '#2563EB',
  },
  testoAnnulla: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
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
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
