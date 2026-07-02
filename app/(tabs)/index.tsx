// ── Schermata principale: lista transazioni filtrata per periodo ──
import { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, ScrollView, StyleSheet, TextInput, Platform, RefreshControl } from 'react-native';
import Text from '../../components/TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import TransactionItem from '../../components/TransactionItem';
import TransactionForm from '../../components/TransactionForm';
import EmptyState from '../../components/EmptyState';
import IllustrazioneMovimenti from '../../components/illustrazioni/IllustrazioneMovimenti';
import FadeInView from '../../components/FadeInView';
import PressableScale from '../../components/PressableScale';
import BottomSheet from '../../components/BottomSheet';
import ConfermaDialog from '../../components/ConfermaDialog';
import SuggerimentoNovita from '../../components/SuggerimentoNovita';
import { useTema, Tema } from '../../constants/tema';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { usePreferenze } from '../../store/usePreferenze';
import { Transazione, TipoTransazione, TipologiaConto } from '../../types';
import { oggiIso } from '../../utils/formatters';
import { generaCsvTransazioni } from '../../utils/csv';
import { esportaFile } from '../../utils/exportFile';

type Periodo = 'mensile' | 'annuale';

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

export default function TransazioniScreen() {
  const { transazioni, categorie, istituti, aggiungiTransazione, modificaTransazione, eliminaTransazione, aggiungiTrasferimento } =
    useFinanceStore();
  const suggerimentoFiltriVisto = usePreferenze((s) => !!s.suggerimentiVisti['filtri-movimenti']);
  const segnaSuggerimentoVisto = usePreferenze((s) => s.segnaSuggerimentoVisto);
  const ricercheRecenti = usePreferenze((s) => s.ricercheRecenti);
  const aggiungiRicercaRecente = usePreferenze((s) => s.aggiungiRicercaRecente);
  const [ricercaFocalizzata, setRicercaFocalizzata] = useState(false);
  const { refreshing, onRefresh } = usePullToRefresh();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [modaleVisibile, setModaleVisibile]                 = useState(false);
  const [transazioneSelezionata, setTransazioneSelezionata] = useState<Transazione | undefined>();
  const [transazioneDaEliminare, setTransazioneDaEliminare] = useState<string | undefined>();

  const [periodo, setPeriodo] = useState<Periodo>('mensile');
  const [dataCorrente, setDataCorrente] = useState(new Date());
  const [cerca, setCerca] = useState('');

  const [modaleFiltri, setModaleFiltri] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<TipoTransazione | null>(null);
  const [filtroIstitutoId, setFiltroIstitutoId] = useState<string | null>(null);
  const [filtroTipologia, setFiltroTipologia] = useState<TipologiaConto | null>(null);
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [filtroCategoriaId, setFiltroCategoriaId] = useState<string | null>(null);

  const numFiltriAttivi =
    (filtroTipo ? 1 : 0) + (filtroIstitutoId ? 1 : 0) + (filtroTipologia ? 1 : 0) + (filtroTag ? 1 : 0) +
    (filtroCategoriaId ? 1 : 0);

  const azzeraFiltri = () => {
    setFiltroTipo(null);
    setFiltroIstitutoId(null);
    setFiltroTipologia(null);
    setFiltroTag(null);
    setFiltroCategoriaId(null);
  };

  const tagDisponibili = useMemo(() => {
    const insieme = new Set<string>();
    for (const tr of transazioni) {
      if (tr.tag) insieme.add(tr.tag);
    }
    return Array.from(insieme).sort((a, b) => a.localeCompare(b));
  }, [transazioni]);

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
    let risultato = transazioniOrdinate;

    if (filtroTipo) {
      risultato = risultato.filter((tr) => tr.tipo === filtroTipo);
    }
    if (filtroIstitutoId) {
      risultato = risultato.filter((tr) => tr.istitutoId === filtroIstitutoId);
    }
    if (filtroTipologia) {
      risultato = risultato.filter((tr) => tr.tipologia === filtroTipologia);
    }
    if (filtroTag) {
      risultato = risultato.filter((tr) => tr.tag === filtroTag);
    }
    if (filtroCategoriaId) {
      risultato = risultato.filter((tr) => tr.categoriaId === filtroCategoriaId);
    }

    if (cerca.trim()) {
      const q = cerca.trim().toLowerCase();
      risultato = risultato.filter((tr) => {
        const cat = categorie.find((c) => c.id === tr.categoriaId);
        return (
          tr.nota?.toLowerCase().includes(q) ||
          tr.tag?.toLowerCase().includes(q) ||
          cat?.nome.toLowerCase().includes(q) ||
          String(tr.importo).includes(q)
        );
      });
    }

    return risultato;
  }, [transazioniOrdinate, cerca, categorie, filtroTipo, filtroIstitutoId, filtroTipologia, filtroTag, filtroCategoriaId]);

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

  const gestisciExport = () => {
    const csv = generaCsvTransazioni(transazioniVisibili, categorie, istituti);
    const nomeFile = `transazioni_${periodoLabel.replace(/\s+/g, '_').toLowerCase()}.csv`;
    esportaFile(nomeFile, csv, 'text/csv');
  };

  const gestisciDuplica = (tr: Transazione) => {
    aggiungiTransazione({
      importo: tr.importo,
      tipo: tr.tipo,
      categoriaId: tr.categoriaId,
      data: oggiIso(),
      ...(tr.nota       != null && { nota: tr.nota }),
      ...(tr.tipologia  != null && { tipologia: tr.tipologia }),
      ...(tr.istitutoId != null && { istitutoId: tr.istitutoId }),
      ...(tr.tag        != null && { tag: tr.tag }),
    });
  };

  return (
    <View style={stili.contenitore}>

      {/* ── Toggle Mensile / Annuale + Navigatore ── */}
      <FadeInView style={stili.controlliContenitore}>
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
          <PressableScale onPress={() => naviga(-1)} hitSlop={10} style={stili.btnNav}>
            <Ionicons name="chevron-back" size={18} color={t.sottile} />
          </PressableScale>
          <Text style={stili.labelPeriodo}>{periodoLabel}</Text>
          <PressableScale onPress={() => naviga(1)} hitSlop={10} style={stili.btnNav}>
            <Ionicons name="chevron-forward" size={18} color={t.sottile} />
          </PressableScale>
        </View>

        <View style={stili.rigaRicerca}>
          <View style={stili.barraRicerca}>
            <Ionicons name="search" size={16} color={t.piuSottile} />
            <TextInput
              style={stili.inputRicerca}
              value={cerca}
              onChangeText={setCerca}
              onFocus={() => setRicercaFocalizzata(true)}
              onBlur={() => setTimeout(() => setRicercaFocalizzata(false), 150)}
              onSubmitEditing={() => { if (cerca.trim()) aggiungiRicercaRecente(cerca.trim()); }}
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
          <PressableScale
            style={[stili.btnFiltri, numFiltriAttivi > 0 && stili.btnFiltriAttivo]}
            onPress={() => { setModaleFiltri(true); segnaSuggerimentoVisto('filtri-movimenti'); }}
            {...suggerimento('Filtri avanzati')}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={numFiltriAttivi > 0 ? '#FFF' : t.sottile}
            />
            {numFiltriAttivi > 0 && (
              <View style={stili.badgeFiltri}>
                <Text style={stili.testoBadgeFiltri}>{numFiltriAttivi}</Text>
              </View>
            )}
            {numFiltriAttivi === 0 && !suggerimentoFiltriVisto && (
              <View style={stili.puntinoNovita} />
            )}
          </PressableScale>
          <PressableScale
            style={stili.btnFiltri}
            onPress={gestisciExport}
            disabled={transazioniVisibili.length === 0}
            {...suggerimento('Esporta CSV')}
          >
            <Ionicons
              name="download-outline"
              size={18}
              color={transazioniVisibili.length === 0 ? t.piuSottile : t.sottile}
            />
          </PressableScale>
        </View>

        {ricercaFocalizzata && cerca.trim() === '' && ricercheRecenti.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={stili.rigaRicercheRecenti} keyboardShouldPersistTaps="handled">
            {ricercheRecenti.map((r) => (
              <TouchableOpacity key={r} style={stili.chipRicerca} onPress={() => setCerca(r)}>
                <Ionicons name="time-outline" size={12} color={t.piuSottile} />
                <Text style={stili.testoChipRicerca} numberOfLines={1}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </FadeInView>

      {transazioniVisibili.length > 0 && (
        <SuggerimentoNovita chiave="dettaglio-transazione" testo="Tocca una transazione per vedere i dettagli" icona="hand-left-outline" />
      )}

      <FlatList
        data={transazioniVisibili}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primario} colors={[t.primario]} />}
        renderItem={({ item }) => (
          <TransactionItem
            transazione={item}
            categoria={categorie.find((c) => c.id === item.categoriaId)}
            istituto={istituti.find((i) => i.id === item.istitutoId)}
            onModifica={() => apriModifica(item)}
            onElimina={() => setTransazioneDaEliminare(item.id)}
            onDuplica={() => gestisciDuplica(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            messaggio={
              cerca.trim()
                ? `Nessun risultato per "${cerca}".`
                : 'Nessuna transazione in questo periodo.'
            }
            icona="receipt-outline"
            illustrazione={!cerca.trim() ? <IllustrazioneMovimenti t={t} /> : undefined}
            {...(!cerca.trim() && { azioneLabel: 'Aggiungi transazione', onAzione: apriNuova })}
          />
        }
        contentContainerStyle={
          transazioniVisibili.length === 0 ? { flex: 1 } : { paddingVertical: 8 }
        }
      />

      {/* Pulsante flottante */}
      <PressableScale style={stili.fab} onPress={apriNuova} {...suggerimento('Inserisci Entrata/Uscita')}>
        <Ionicons name="add" size={28} color="#FFF" />
      </PressableScale>

      <TransactionForm
        visibile={modaleVisibile}
        onChiudi={() => setModaleVisibile(false)}
        onSalva={gestisciSalva}
        onSalvaTrasferimento={aggiungiTrasferimento}
        transazioneEsistente={transazioneSelezionata}
        categorie={categorie}
        istituti={istituti}
      />

      {/* ── Conferma eliminazione ── */}
      <ConfermaDialog
        visibile={!!transazioneDaEliminare}
        onChiudi={() => setTransazioneDaEliminare(undefined)}
        titolo="Elimina transazione"
        messaggio="Sei sicuro? L'operazione non può essere annullata."
        onConferma={() => {
          if (transazioneDaEliminare) eliminaTransazione(transazioneDaEliminare);
          setTransazioneDaEliminare(undefined);
        }}
      />

      {/* ── Modal filtri avanzati ── */}
      <BottomSheet visibile={modaleFiltri} onChiudi={() => setModaleFiltri(false)}>
        <View style={stili.contenutoFiltri}>
          <Text style={stili.titoloModal}>Filtri</Text>

          <ScrollView>
            <Text style={stili.etichettaFiltro}>Tipo</Text>
            <View style={stili.rigaChip}>
              {([
                { valore: null,        label: 'Tutte' },
                { valore: 'entrata' as TipoTransazione, label: 'Entrate' },
                { valore: 'uscita'  as TipoTransazione, label: 'Uscite' },
              ]).map(({ valore, label }) => (
                <TouchableOpacity
                  key={label}
                  style={[stili.chip, filtroTipo === valore && stili.chipAttivo]}
                  onPress={() => setFiltroTipo(valore)}
                >
                  <Text style={[stili.testoChip, filtroTipo === valore && stili.testoChipAttivo]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={stili.etichettaFiltro}>Tipologia conto</Text>
            <View style={stili.rigaChip}>
              {([
                { valore: null,                            label: 'Tutte' },
                { valore: 'conto_corrente' as TipologiaConto, label: 'Conto corrente' },
                { valore: 'carta_credito'  as TipologiaConto, label: 'Carta di credito' },
              ]).map(({ valore, label }) => (
                <TouchableOpacity
                  key={label}
                  style={[stili.chip, filtroTipologia === valore && stili.chipAttivo]}
                  onPress={() => setFiltroTipologia(valore)}
                >
                  <Text style={[stili.testoChip, filtroTipologia === valore && stili.testoChipAttivo]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {istituti.length > 0 && (
              <>
                <Text style={stili.etichettaFiltro}>Conto / Istituto</Text>
                <View style={stili.rigaChip}>
                  <TouchableOpacity
                    style={[stili.chip, filtroIstitutoId === null && stili.chipAttivo]}
                    onPress={() => setFiltroIstitutoId(null)}
                  >
                    <Text style={[stili.testoChip, filtroIstitutoId === null && stili.testoChipAttivo]}>Tutti</Text>
                  </TouchableOpacity>
                  {istituti.map((ist) => (
                    <TouchableOpacity
                      key={ist.id}
                      style={[stili.chip, filtroIstitutoId === ist.id && stili.chipAttivo]}
                      onPress={() => setFiltroIstitutoId(ist.id)}
                    >
                      <Text style={[stili.testoChip, filtroIstitutoId === ist.id && stili.testoChipAttivo]}>{ist.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {categorie.length > 0 && (
              <>
                <Text style={stili.etichettaFiltro}>Categoria</Text>
                <View style={stili.rigaChip}>
                  <TouchableOpacity
                    style={[stili.chip, filtroCategoriaId === null && stili.chipAttivo]}
                    onPress={() => setFiltroCategoriaId(null)}
                  >
                    <Text style={[stili.testoChip, filtroCategoriaId === null && stili.testoChipAttivo]}>Tutte</Text>
                  </TouchableOpacity>
                  {categorie.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[stili.chip, filtroCategoriaId === cat.id && stili.chipAttivo]}
                      onPress={() => setFiltroCategoriaId(cat.id)}
                    >
                      <Text style={[stili.testoChip, filtroCategoriaId === cat.id && stili.testoChipAttivo]}>{cat.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {tagDisponibili.length > 0 && (
              <>
                <Text style={stili.etichettaFiltro}>Tag</Text>
                <View style={stili.rigaChip}>
                  <TouchableOpacity
                    style={[stili.chip, filtroTag === null && stili.chipAttivo]}
                    onPress={() => setFiltroTag(null)}
                  >
                    <Text style={[stili.testoChip, filtroTag === null && stili.testoChipAttivo]}>Tutti</Text>
                  </TouchableOpacity>
                  {tagDisponibili.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[stili.chip, filtroTag === tag && stili.chipAttivo]}
                      onPress={() => setFiltroTag(tag)}
                    >
                      <Text style={[stili.testoChip, filtroTag === tag && stili.testoChipAttivo]}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={stili.rigaBtnModal}>
            <TouchableOpacity style={[stili.btnModal, stili.btnAnnulla]} onPress={azzeraFiltri}>
              <Text style={stili.testoAnnulla}>Azzera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[stili.btnModal, stili.btnApplica]}
              onPress={() => setModaleFiltri(false)}
            >
              <Text style={stili.testoElimina}>Applica</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
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
    rigaRicerca: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    barraRicerca: {
      flex: 1,
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

    // ── Cronologia ricerca ──
    rigaRicercheRecenti: {
      marginTop: 8,
    },
    chipRicerca: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: t.carta,
      borderRadius: 18,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    testoChipRicerca: {
      fontSize: 12,
      color: t.sottile,
      maxWidth: 140,
    },

    // ── Pulsante filtri ──
    btnFiltri: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: t.carta,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    btnFiltriAttivo: {
      backgroundColor: t.primario,
    },
    puntinoNovita: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: t.arancio,
      borderWidth: 1.5,
      borderColor: t.carta,
    },
    badgeFiltri: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: t.uscita,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    testoBadgeFiltri: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFF',
    },

    // ── Modal filtri ──
    etichettaFiltro: {
      alignSelf: 'flex-start',
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      marginTop: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    rigaChip: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.sfondoInput,
    },
    chipAttivo: {
      backgroundColor: t.primarioSfondo,
      borderColor: t.primario,
    },
    testoChip: {
      fontSize: 12,
      color: t.sottile,
      fontWeight: '500',
    },
    testoChipAttivo: {
      color: t.primario,
      fontWeight: '700',
    },
    btnApplica: {
      backgroundColor: t.primario,
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

    // ── Modal filtri ──
    contenutoFiltri: {
      paddingHorizontal: 20,
      paddingBottom: 28,
      gap: 4,
    },
    titoloModal: {
      fontSize: 17,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 4,
    },
    rigaBtnModal: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
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
