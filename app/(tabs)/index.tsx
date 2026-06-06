// ── Schermata principale: lista transazioni filtrata per periodo ──
import { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import TransactionItem from '../../components/TransactionItem';
import TransactionForm from '../../components/TransactionForm';
import EmptyState from '../../components/EmptyState';
import { useTema, Tema } from '../../constants/tema';
import { Transazione } from '../../types';

type Periodo = 'mensile' | 'annuale';

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export default function TransazioniScreen() {
  const { transazioni, categorie, istituti, aggiungiTransazione, modificaTransazione, eliminaTransazione } =
    useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

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
    return transazioniOrdinate.filter((tr) => {
      const cat = categorie.find((c) => c.id === tr.categoriaId);
      return (
        tr.nota?.toLowerCase().includes(q) ||
        cat?.nome.toLowerCase().includes(q) ||
        String(tr.importo).includes(q)
      );
    });
  }, [transazioniOrdinate, cerca, categorie]);

  const apriNuova = () => {
    setTransazioneSelezionata(undefined);
    setModaleVisibile(true);
  };

  const apriModifica = (tr: Transazione) => {
    setTransazioneSelezionata(tr);
    setModaleVisibile(true);
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
          <TouchableOpacity onPress={() => naviga(-1)} hitSlop={10} style={stili.btnNav}>
            <Ionicons name="chevron-back" size={18} color={t.sottile} />
          </TouchableOpacity>
          <Text style={stili.labelPeriodo}>{periodoLabel}</Text>
          <TouchableOpacity onPress={() => naviga(1)} hitSlop={10} style={stili.btnNav}>
            <Ionicons name="chevron-forward" size={18} color={t.sottile} />
          </TouchableOpacity>
        </View>

        <View style={stili.barraRicerca}>
          <Ionicons name="search" size={16} color={t.piuSottile} />
          <TextInput
            style={stili.inputRicerca}
            value={cerca}
            onChangeText={setCerca}
            placeholder="Cerca per nota, categoria o importo…"
            placeholderTextColor={t.segnaposto}
            returnKeyType="search"
          />
          {cerca.length > 0 && (
            <TouchableOpacity onPress={() => setCerca('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={t.piuSottile} />
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
            onElimina={() => setTransazioneDaEliminare(item.id)}
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

      {/* Pulsante flottante */}
      <TouchableOpacity style={stili.fab} onPress={apriNuova} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <TransactionForm
        visibile={modaleVisibile}
        onChiudi={() => setModaleVisibile(false)}
        onSalva={gestisciSalva}
        transazioneEsistente={transazioneSelezionata}
        categorie={categorie}
        istituti={istituti}
      />

      {/* ── Conferma eliminazione ── */}
      <Modal visible={!!transazioneDaEliminare} transparent animationType="fade">
        <View style={stili.sfondoModal}>
          <View style={stili.cartaModal}>
            <View style={stili.cerchioElimina}>
              <Ionicons name="trash-outline" size={26} color={t.uscita} />
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

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
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
      backgroundColor: t.toggleSfondo,
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
      backgroundColor: t.toggleAttivo,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleTesto: {
      fontSize: 14,
      fontWeight: '500',
      color: t.sottile,
    },
    toggleTestoAttivo: {
      color: t.titolo,
      fontWeight: '700',
    },
    navigatore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.carta,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    btnNav: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: t.superfice,
      justifyContent: 'center',
      alignItems: 'center',
    },
    labelPeriodo: {
      fontSize: 15,
      fontWeight: '700',
      color: t.titolo,
    },

    // ── Barra ricerca ──
    barraRicerca: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.carta,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    inputRicerca: {
      flex: 1,
      fontSize: 14,
      color: t.titolo,
    },

    // ── FAB ──
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.primario,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: t.primario,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },

    // ── Modal conferma eliminazione ──
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
  });
}
