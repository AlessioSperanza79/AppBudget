// ── Schermata Analisi: wrapper con toggle Grafici/Tabelle + periodo Mensile/Annuale ──
import { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from '../../components/TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatEuro } from '../../utils/formatters';
import CountUpText from '../../components/CountUpText';
import EmptyState from '../../components/EmptyState';
import FadeInView from '../../components/FadeInView';
import PressableScale from '../../components/PressableScale';
import GraficiVista from '../../components/analisi/GraficiVista';
import TabelleVista from '../../components/analisi/TabelleVista';
import { useTema, Tema } from '../../constants/tema';

type Vista = 'mensile' | 'annuale';
type SottoVista = 'grafici' | 'tabelle';

const MESI_INTERI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export default function AnalisiScreen() {
  const { transazioni, categorie, istituti, aggiornaBudgetCategoria } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const oggi = new Date();
  const [sottoVista, setSottoVista] = useState<SottoVista>('grafici');
  const [vista, setVista] = useState<Vista>('annuale');
  const [anno,  setAnno]  = useState(oggi.getFullYear());
  const [mese,  setMese]  = useState(oggi.getMonth());

  const navigaPrecedente = () => {
    if (vista === 'annuale') { setAnno((a) => a - 1); return; }
    if (mese === 0) { setMese(11); setAnno((a) => a - 1); }
    else { setMese((m) => m - 1); }
  };

  const navigaSuccessivo = () => {
    if (vista === 'annuale') { setAnno((a) => a + 1); return; }
    if (mese === 11) { setMese(0); setAnno((a) => a + 1); }
    else { setMese((m) => m + 1); }
  };

  const periodoLabel = vista === 'annuale'
    ? String(anno)
    : `${MESI_INTERI[mese]} ${anno}`;

  // ── Totali per la riga riepilogo condivisa ──
  const transazioniFiltrate = useMemo(() => {
    const base = transazioni.filter((tr) => !tr.ricorrente);
    if (vista === 'annuale') {
      return base.filter((tr) => tr.data.startsWith(String(anno)));
    }
    const mm = String(mese + 1).padStart(2, '0');
    return base.filter((tr) => tr.data.startsWith(`${anno}-${mm}`));
  }, [transazioni, vista, anno, mese]);

  const totaleEntrate = useMemo(
    () => transazioniFiltrate.filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0),
    [transazioniFiltrate],
  );
  const totaleUscite = useMemo(
    () => transazioniFiltrate.filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0),
    [transazioniFiltrate],
  );
  const saldo = totaleEntrate - totaleUscite;

  if (transazioni.filter((tr) => !tr.ricorrente).length === 0) {
    return (
      <EmptyState
        messaggio={'Nessun dato da mostrare.\nAggiungi alcune transazioni per vedere analisi e grafici.'}
        icona="analytics-outline"
      />
    );
  }

  return (
    <View style={stili.contenitore}>

      {/* ── Toggle Grafici / Tabelle ── */}
      <View style={stili.toggleContenitore}>
        {(['grafici', 'tabelle'] as SottoVista[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[stili.tab, sottoVista === v && stili.tabAttivo]}
            onPress={() => setSottoVista(v)}
          >
            <Text style={[stili.testoTab, sottoVista === v && stili.testoTabAttivo]}>
              {v === 'grafici' ? 'Grafici' : 'Tabelle'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Toggle Mensile / Annuale + navigatore ── */}
      <View style={stili.controlliContenitore}>
        <View style={stili.toggleSecondario}>
          {(['mensile', 'annuale'] as Vista[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={[stili.tabSecondario, vista === v && stili.tabSecondarioAttivo]}
              onPress={() => setVista(v)}
            >
              <Text style={[stili.testoTabSecondario, vista === v && stili.testoTabSecondarioAttivo]}>
                {v === 'mensile' ? 'Mensile' : 'Annuale'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={stili.navigatore}>
          <PressableScale onPress={navigaPrecedente} hitSlop={10} style={stili.btnNav}>
            <Ionicons name="chevron-back" size={18} color={t.sottile} />
          </PressableScale>
          <Text style={stili.testoPeriodo}>{periodoLabel}</Text>
          <PressableScale onPress={navigaSuccessivo} hitSlop={10} style={stili.btnNav}>
            <Ionicons name="chevron-forward" size={18} color={t.sottile} />
          </PressableScale>
        </View>
      </View>

      {/* ── Card saldo / entrate / uscite ── */}
      <FadeInView style={stili.rigaCard}>
        <View style={[stili.card, { backgroundColor: t.entrataSfondo }]}>
          <Ionicons name="arrow-up-circle-outline" size={16} color={t.entrata} />
          <Text style={[stili.etichettaCard, { color: t.entrata }]}>Entrate</Text>
          <CountUpText valore={totaleEntrate} formatta={formatEuro} style={[stili.valoreCard, { color: t.entrata }]} numberOfLines={1} />
        </View>
        <View style={[stili.card, { backgroundColor: t.uscitaSfondo }]}>
          <Ionicons name="arrow-down-circle-outline" size={16} color={t.uscita} />
          <Text style={[stili.etichettaCard, { color: t.uscita }]}>Uscite</Text>
          <CountUpText valore={totaleUscite} formatta={formatEuro} style={[stili.valoreCard, { color: t.uscita }]} numberOfLines={1} />
        </View>
        <View style={[stili.card, { backgroundColor: saldo >= 0 ? t.primarioSfondo : t.arancioSfondo }]}>
          <Ionicons
            name={saldo >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
            size={16}
            color={saldo >= 0 ? t.primario : t.arancio}
          />
          <Text style={[stili.etichettaCard, { color: saldo >= 0 ? t.primario : t.arancio }]}>Saldo</Text>
          <CountUpText valore={saldo} formatta={formatEuro} style={[stili.valoreCard, { color: saldo >= 0 ? t.primario : t.arancio }]} numberOfLines={1} />
        </View>
      </FadeInView>

      {/* ── Contenuto sotto-vista ── */}
      {sottoVista === 'grafici' ? (
        <GraficiVista transazioni={transazioni} categorie={categorie} t={t} vista={vista} anno={anno} mese={mese} />
      ) : (
        <TabelleVista
          transazioni={transazioni}
          categorie={categorie}
          istituti={istituti}
          aggiornaBudgetCategoria={aggiornaBudgetCategoria}
          t={t}
          vista={vista}
          anno={anno}
          mese={mese}
          periodoLabel={periodoLabel}
        />
      )}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stili

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },

    // ── Toggle principale Grafici/Tabelle ──
    toggleContenitore: {
      flexDirection: 'row',
      backgroundColor: t.toggleSfondo,
      borderRadius: 12,
      margin: 16,
      marginBottom: 8,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 9,
      alignItems: 'center',
    },
    tabAttivo: {
      backgroundColor: t.toggleAttivo,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    testoTab:       { fontSize: 14, fontWeight: '500', color: t.piuSottile },
    testoTabAttivo: { fontSize: 14, fontWeight: '700', color: t.titolo },

    // ── Riga periodo (toggle secondario + navigatore) ──
    controlliContenitore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    toggleSecondario: {
      flexDirection: 'row',
      backgroundColor: t.toggleSfondo,
      borderRadius: 10,
      padding: 3,
    },
    tabSecondario: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 7,
      alignItems: 'center',
    },
    tabSecondarioAttivo: {
      backgroundColor: t.toggleAttivo,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    testoTabSecondario:       { fontSize: 12, fontWeight: '500', color: t.piuSottile },
    testoTabSecondarioAttivo: { fontSize: 12, fontWeight: '700', color: t.titolo },

    navigatore: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.carta,
      borderRadius: 12,
      paddingVertical: 6,
      paddingHorizontal: 10,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    btnNav: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: t.superfice,
      justifyContent: 'center',
      alignItems: 'center',
    },
    testoPeriodo: {
      fontSize: 14,
      fontWeight: '700',
      color: t.titolo,
    },

    // ── Cards totali ──
    rigaCard: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 8,
    },
    card: {
      flex: 1,
      borderRadius: 18,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    etichettaCard: {
      fontSize: 11,
      fontWeight: '600',
    },
    valoreCard: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
