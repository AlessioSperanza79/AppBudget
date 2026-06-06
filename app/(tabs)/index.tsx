// ── Schermata principale: lista transazioni filtrata per periodo ──
import { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import TransactionItem from '../../components/TransactionItem';
import TransactionForm from '../../components/TransactionForm';
import EmptyState from '../../components/EmptyState';
import { Transazione } from '../../types';

type Periodo = 'mensile' | 'annuale';

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export default function TransazioniScreen() {
  const { transazioni, categorie, istituti, aggiungiTransazione, modificaTransazione, eliminaTransazione } =
    useFinanceStore();

  const [modaleVisibile, setModaleVisibile]                 = useState(false);
  const [transazioneSelezionata, setTransazioneSelezionata] = useState<Transazione | undefined>();
  const [transazioneDaEliminare, setTransazioneDaEliminare] = useState<string | undefined>();

  const [periodo, setPeriodo] = useState<Periodo>('mensile');
  const [dataCorrente, setDataCorrente] = useState(new Date());
  const [cerca, setCerca] = useState('');

  const naviga = (direzione: 1 | -1) => {
    setDataCorrente((prev) => {
      const d = new Date(prev);
      if (periodo === 'mensile') {
        d.setMonth(d.getMonth() + direzione);
      } else {
        d.setFullYear(d.getFullYear() + direzione);
      }
      return d;
    });
  };

  const periodoLabel = periodo === 'mensile'
    ? `${MESI[dataCorrente.getMonth()]} ${dataCorrente.getFullYear()}`
    : `${dataCorrente.getFullYear()}`;

  const transazioniOrdinate = useMemo(() => {
    return [...transazioni]
      .filter((t) => !t.ricorrente)
      .filter((t) => {
        const d = new Date(t.data + 'T00:00:00');
        if (periodo === 'mensile') {
          return (
            d.getFullYear() === dataCorrente.getFullYear() &&
            d.getMonth() === dataCorrente.getMonth()
          );
        }
        return d.getFullYear() === dataCorrente.getFullYear();
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transazioni, periodo, dataCorrente]);

  const transazioniVisibili = useMemo(() => {
    if (!cerca.trim()) return transazioniOrdinate;
    const q = cerca.trim().toLowerCase();
    return transazioniOrdinate.filter((t) => {
      const cat = categorie.find((c) => c.id === t.categoriaId);
      return (
        t.nota?.toLowerCase().includes(q) ||
        cat?.nome.toLowerCase().includes(q) ||
        String(t.importo).includes(q)
      );
    });
  }, [transazioniOrdinate, cerca, categorie]);

  const apriNuova = () => {
    setTransazioneSelezionata(undefined);
    setModaleVisibile(true);
  };

  const apriModifica = (t: Transazione) => {
    setTransazioneSelezionata(t);
    setModaleVisibile(true);
  };

  const confermaElimina = (id: string) => {
    setTransazioneDaEliminare(id);
  };

  const gestisciSalva = (dati: Omit<Transazione, 'id'>) => {
    if (transazioneSelezionata) {
      modificaTransazione(transazioneSelezionata.id, dati);
    } else {
      aggiungiTransazione(dati);
    }
  };

  return (
    <View style={stili.contenitore}>

      {/* ── Toggle Mensile / Annuale + Navigatore ── */}
      <View style={stili.controlliContenitore}>
        <View style={stili.toggle}>
          {(['mensile', 'annuale'] as Periodo[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[stili.toggleBtn, periodo === p && stili.toggleBtnAttivo]}
              onPress={() => setPeriodo(p)}
            >
              <Text style={[stili.toggleTesto, periodo === p && stili.toggleTestoAttivo]}>
                {p === 'mensile' ? 'Mensile' : 'Annuale'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={stili.navigatore}>
          <TouchableOpacity onPress={() => naviga(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={stili.labelPeriodo}>{periodoLabel}</Text>
          <TouchableOpacity onPress={() => naviga(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <View style={stili.barraRicerca}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            style={stili.inputRicerca}
            value={cerca}
            onChangeText={setCerca}
            placeholder="Cerca per nota, categoria o importo…"
            placeholderTextColor="#CBD5E1"
            returnKeyType="search"
          />
          {cerca.length > 0 && (
            <TouchableOpacity onPress={() => setCerca('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={transazioniVisibili}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transazione={item}
            categoria={categorie.find((c) => c.id === item.categoriaId)}
            istituto={istituti.find((i) => i.id === item.istitutoId)}
            onModifica={() => apriModifica(item)}
            onElimina={() => confermaElimina(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            messaggio={
              cerca.trim()
                ? `Nessun risultato per "${cerca}".`
                : `Nessuna transazione in questo periodo.\nPremi + per aggiungerne una.`
            }
            icona="receipt-outline"
          />
        }
        contentContainerStyle={
          transazioniVisibili.length === 0 ? { flex: 1 } : { paddingVertical: 8 }
        }
      />

      {/* Pulsante flottante per aggiungere una nuova transazione */}
      <TouchableOpacity style={stili.fab} onPress={apriNuova}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <TransactionForm
        visibile={modaleVisibile}
        onChiudi={() => setModaleVisibile(false)}
        onSalva={gestisciSalva}
        transazioneEsistente={transazioneSelezionata}
        categorie={categorie}
        istituti={istituti}
      />

      {/* ── Conferma eliminazione transazione ── */}
      <Modal visible={!!transazioneDaEliminare} transparent animationType="fade">
        <View style={stili.sfondoModal}>
          <View style={stili.cartaModal}>
            <View style={stili.cerchioElimina}>
              <Ionicons name="trash-outline" size={28} color="#DC2626" />
            </View>
            <Text style={stili.titoloModal}>Elimina transazione</Text>
            <Text style={stili.testoModal}>Sei sicuro? L'operazione non può essere annullata.</Text>
            <View style={stili.rigaBtnModal}>
              <TouchableOpacity
                style={[stili.btnModal, stili.btnAnnulla]}
                onPress={() => setTransazioneDaEliminare(undefined)}
              >
                <Text style={stili.testoAnnulla}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[stili.btnModal, stili.btnElimina]}
                onPress={() => {
                  if (transazioneDaEliminare) eliminaTransazione(transazioneDaEliminare);
                  setTransazioneDaEliminare(undefined);
                }}
              >
                <Text style={stili.testoElimina}>Elimina</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Controlli periodo ──
  controlliContenitore: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleBtnAttivo: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleTesto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  toggleTestoAttivo: {
    color: '#0F172A',
    fontWeight: '700',
  },
  navigatore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  labelPeriodo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  // ── Barra ricerca ──
  barraRicerca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputRicerca: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  // ── Modal conferma eliminazione ──
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
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
