// ── Vista "Budget" della schermata Pianifica: piano mensile a somma zero con rollover ──
import { useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, TextInput, StyleSheet, Platform, RefreshControl } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Categoria } from '../../types';
import { formatEuro } from '../../utils/formatters';
import { iconaCategoria } from '../../utils/iconeCategorie';
import { calcolaRigheBudget } from '../../utils/budget';
import EmptyState from '../EmptyState';
import PressableScale from '../PressableScale';
import BottomSheet from '../BottomSheet';
import { useTema, Tema, FONT_ESPRESSIVO } from '../../constants/tema';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export default function BudgetVista() {
  const { transazioni, categorie, reddito, aggiornaBudgetCategoria, aggiornaRolloverCategoria } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);
  const { refreshing, onRefresh } = usePullToRefresh();

  const oggi = new Date();
  const [anno, setAnno] = useState(oggi.getFullYear());
  const [mese, setMese] = useState(oggi.getMonth());

  const naviga = (dir: 1 | -1) => {
    if (dir === 1) {
      if (mese === 11) { setMese(0); setAnno((a) => a + 1); }
      else setMese((m) => m + 1);
    } else {
      if (mese === 0) { setMese(11); setAnno((a) => a - 1); }
      else setMese((m) => m - 1);
    }
  };

  const categorieBudget = useMemo(
    () => categorie.filter((c) => (c.budgetMensile ?? 0) > 0),
    [categorie]
  );
  const categorieSenzaBudget = useMemo(
    () => categorie.filter((c) => !(c.budgetMensile ?? 0)),
    [categorie]
  );

  const righe = useMemo(
    () => calcolaRigheBudget(transazioni, categorie, anno, mese),
    [transazioni, categorie, anno, mese],
  );

  const totaleAssegnato = categorieBudget.reduce((s, c) => s + (c.budgetMensile ?? 0), 0);
  const daAssegnare = reddito - totaleAssegnato;
  const coloreDaAssegnare = daAssegnare === 0 ? t.entrata : daAssegnare > 0 ? t.primario : t.uscita;
  const sfondoDaAssegnare = daAssegnare === 0 ? t.entrataSfondo : daAssegnare > 0 ? t.primarioSfondo : t.uscitaSfondo;

  // ── Modal imposta/modifica importo ──
  const [categoriaInModifica, setCategoriaInModifica] = useState<Categoria | undefined>();
  const [importoInput, setImportoInput] = useState('');
  const [selettoreVisibile, setSelettoreVisibile] = useState(false);

  const apriModifica = (cat: Categoria) => {
    setSelettoreVisibile(false);
    setCategoriaInModifica(cat);
    setImportoInput(cat.budgetMensile ? String(cat.budgetMensile) : '');
  };

  const salvaImporto = () => {
    if (!categoriaInModifica) return;
    const v = parseFloat(importoInput.replace(',', '.'));
    aggiornaBudgetCategoria(categoriaInModifica.id, isNaN(v) || v <= 0 ? undefined : v);
    setCategoriaInModifica(undefined);
  };

  return (
    <View style={stili.contenitore}>
      {/* ── Navigatore mese ── */}
      <View style={stili.rigaMese}>
        <PressableScale onPress={() => naviga(-1)} hitSlop={10} style={stili.btnNav}>
          <Ionicons name="chevron-back" size={18} color={t.sottile} />
        </PressableScale>
        <Text style={stili.testoMese}>{MESI[mese]} {anno}</Text>
        <PressableScale onPress={() => naviga(1)} hitSlop={10} style={stili.btnNav}>
          <Ionicons name="chevron-forward" size={18} color={t.sottile} />
        </PressableScale>
      </View>

      {/* ── Card "da assegnare": il cuore del metodo a somma zero ── */}
      <View style={[stili.cardAssegnare, { backgroundColor: sfondoDaAssegnare }]}>
        <Text style={[stili.etichettaAssegnare, { color: coloreDaAssegnare }]}>
          {daAssegnare === 0 ? 'Ogni euro ha un compito' : daAssegnare > 0 ? 'Da assegnare' : 'Assegnato oltre il reddito'}
        </Text>
        <Text style={[stili.importoAssegnare, { color: coloreDaAssegnare }]}>
          {formatEuro(Math.abs(daAssegnare))}
        </Text>
        <Text style={stili.dettaglioAssegnare}>
          Reddito {formatEuro(reddito)} · Assegnato {formatEuro(totaleAssegnato)}
        </Text>
      </View>

      <FlatList
        data={righe}
        keyExtractor={(r) => r.categoria.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primario} colors={[t.primario]} />}
        ListEmptyComponent={
          <EmptyState
            icona="wallet-outline"
            messaggio={'Nessuna categoria nel piano.\nPremi "Aggiungi categoria" per assegnarle un budget.'}
          />
        }
        renderItem={({ item }) => {
          const base = item.assegnato + item.avanzoPrecedente;
          const perc = base > 0 ? Math.min((item.speso / base) * 100, 100) : (item.speso > 0 ? 100 : 0);
          const coloreBarra = item.disponibile < 0 ? t.uscita : perc >= 80 ? t.arancio : t.entrata;

          return (
            <View style={stili.riga}>
              <View style={stili.rigaTop}>
                <View style={[stili.pallino, { backgroundColor: item.categoria.colore }]}>
                  <Ionicons name={iconaCategoria(item.categoria.nome)} size={12} color="#FFFFFF" />
                </View>
                <Text style={stili.nomeCategoria} numberOfLines={1}>{item.categoria.nome}</Text>
                <PressableScale
                  onPress={() => aggiornaRolloverCategoria(item.categoria.id, !item.categoria.rollover)}
                  style={stili.btnIcona}
                  hitSlop={8}
                  {...suggerimento(item.categoria.rollover ? "Non riportare più l'avanzo" : "Riporta l'avanzo al mese successivo")}
                >
                  <Ionicons
                    name={item.categoria.rollover ? 'repeat' : 'repeat-outline'}
                    size={17}
                    color={item.categoria.rollover ? t.primario : t.piuSottile}
                  />
                </PressableScale>
                <PressableScale onPress={() => apriModifica(item.categoria)} style={stili.btnIcona} hitSlop={8} {...suggerimento('Modifica importo')}>
                  <Ionicons name="pencil-outline" size={16} color={t.primario} />
                </PressableScale>
              </View>

              <View style={stili.barraSfondo}>
                <View style={[stili.barra, { width: `${perc}%` as `${number}%`, backgroundColor: coloreBarra }]} />
              </View>

              <View style={stili.rigaValori}>
                <Text style={stili.testoValori}>
                  Speso {formatEuro(item.speso)} di {formatEuro(base)}
                </Text>
                <Text style={[stili.testoDisponibile, { color: item.disponibile < 0 ? t.uscita : t.entrata }]}>
                  {item.disponibile < 0 ? 'Sforato di ' : 'Disponibile '}{formatEuro(Math.abs(item.disponibile))}
                </Text>
              </View>

              {item.categoria.rollover && item.avanzoPrecedente !== 0 && (
                <Text style={stili.testoAvanzo}>
                  {item.avanzoPrecedente > 0 ? '+' : '−'}{formatEuro(Math.abs(item.avanzoPrecedente))} dal mese scorso
                </Text>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <PressableScale style={stili.btnAggiungi} onPress={() => setSelettoreVisibile(true)}>
            <Ionicons name="add-circle-outline" size={20} color={t.primario} />
            <Text style={stili.testoAggiungi}>Aggiungi categoria al piano</Text>
          </PressableScale>
        }
      />

      {/* ── Selettore categoria da aggiungere al piano ── */}
      <BottomSheet visibile={selettoreVisibile} onChiudi={() => setSelettoreVisibile(false)}>
        <View style={stili.corpoModal}>
          <Text style={stili.titoloModal}>Aggiungi categoria al piano</Text>
          {categorieSenzaBudget.length === 0 ? (
            <Text style={stili.testoModalVuoto}>Tutte le categorie hanno già un budget assegnato.</Text>
          ) : (
            categorieSenzaBudget.map((cat) => (
              <TouchableOpacity key={cat.id} style={stili.rigaSelettore} onPress={() => apriModifica(cat)}>
                <View style={[stili.pallino, { backgroundColor: cat.colore }]}>
                  <Ionicons name={iconaCategoria(cat.nome)} size={12} color="#FFFFFF" />
                </View>
                <Text style={stili.nomeCategoria}>{cat.nome}</Text>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 16 }} />
        </View>
      </BottomSheet>

      {/* ── Modal imposta/modifica importo ── */}
      <BottomSheet visibile={!!categoriaInModifica} onChiudi={() => setCategoriaInModifica(undefined)}>
        <View style={stili.corpoModal}>
          <Text style={stili.titoloModal}>Budget: {categoriaInModifica?.nome}</Text>
          <Text style={stili.etichetta}>Importo mensile (€)</Text>
          <TextInput
            style={stili.input}
            value={importoInput}
            onChangeText={setImportoInput}
            placeholder="Es. 200"
            placeholderTextColor={t.segnaposto}
            keyboardType="decimal-pad"
          />
          <View style={stili.rigaBottoni}>
            <TouchableOpacity style={stili.btnAnnulla} onPress={() => setCategoriaInModifica(undefined)}>
              <Text style={stili.testoAnnulla}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={stili.btnConferma} onPress={salvaImporto}>
              <Text style={stili.testoConferma}>Salva</Text>
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
    },
    rigaMese: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      paddingTop: 12,
    },
    btnNav: {
      padding: 6,
    },
    testoMese: {
      fontSize: 15,
      fontWeight: '700',
      color: t.titolo,
      minWidth: 120,
      textAlign: 'center',
    },

    // ── Card "da assegnare" ──
    cardAssegnare: {
      margin: 16,
      marginBottom: 4,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      gap: 4,
    },
    etichettaAssegnare: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    importoAssegnare: {
      fontSize: 30,
      fontWeight: '800',
      fontFamily: FONT_ESPRESSIVO,
    },
    dettaglioAssegnare: {
      fontSize: 12,
      color: t.piuSottile,
      marginTop: 2,
    },

    // ── Righe categoria ──
    riga: {
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
    rigaTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    pallino: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    nomeCategoria: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: t.titolo,
    },
    btnIcona: {
      padding: 4,
    },
    barraSfondo: {
      height: 6,
      borderRadius: 3,
      backgroundColor: t.bordoSottile,
      overflow: 'hidden',
      marginBottom: 8,
    },
    barra: {
      height: 6,
      borderRadius: 3,
    },
    rigaValori: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    testoValori: {
      fontSize: 12,
      color: t.piuSottile,
    },
    testoDisponibile: {
      fontSize: 12,
      fontWeight: '700',
    },
    testoAvanzo: {
      fontSize: 11,
      color: t.piuSottile,
      marginTop: 4,
    },

    // ── Bottone aggiungi ──
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
      paddingBottom: 24,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 4,
    },
    testoModalVuoto: {
      fontSize: 14,
      color: t.sottile,
      marginTop: 12,
      marginBottom: 8,
    },
    rigaSelettore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.bordoSottile,
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
