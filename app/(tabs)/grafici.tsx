// ── Schermata Grafici: vista mensile (torta + linea) e annuale (barre + categorie) ──
import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatEuro } from '../../utils/formatters';
import EmptyState from '../../components/EmptyState';
import { useTema, Tema } from '../../constants/tema';

const LARGHEZZA = Dimensions.get('window').width;
const LARGHEZZA_CHART = LARGHEZZA - 64;

const MESI       = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MESI_BREVI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

type Vista = 'mensile' | 'annuale';

export default function GraficiScreen() {
  const { transazioni, categorie } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [vista, setVista] = useState<Vista>('mensile');
  const [annoSel, setAnnoSel] = useState(new Date().getFullYear());
  const [meseSel, setMeseSel] = useState(new Date().getMonth());

  const naviga = (dir: 1 | -1) => {
    if (vista === 'annuale') {
      setAnnoSel((a) => a + dir);
    } else {
      let nm = meseSel + dir;
      let na = annoSel;
      if (nm < 0)  { nm = 11; na--; }
      if (nm > 11) { nm = 0;  na++; }
      setMeseSel(nm);
      setAnnoSel(na);
    }
  };

  const labelPeriodo = vista === 'annuale'
    ? String(annoSel)
    : `${MESI[meseSel]} ${annoSel}`;

  const mesiAnno = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const chiave = `${annoSel}-${String(i + 1).padStart(2, '0')}`;
      const ts = transazioni.filter((tr) => !tr.ricorrente && tr.data.startsWith(chiave));
      return {
        entrate: ts.filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0),
        uscite:  ts.filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0),
      };
    }),
    [transazioni, annoSel],
  );

  const datiCategorieAnno = useMemo(() =>
    categorie
      .map((cat) => ({
        id: cat.id, nome: cat.nome, colore: cat.colore,
        value: transazioni
          .filter((tr) => !tr.ricorrente && tr.tipo === 'uscita' && tr.categoriaId === cat.id && tr.data.startsWith(String(annoSel)))
          .reduce((s, tr) => s + tr.importo, 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    [transazioni, categorie, annoSel],
  );

  const chiaveMese = `${annoSel}-${String(meseSel + 1).padStart(2, '0')}`;

  const transazioniFiltrateMese = useMemo(
    () => transazioni.filter((tr) => !tr.ricorrente && tr.data.startsWith(chiaveMese)),
    [transazioni, chiaveMese],
  );

  const datiTorta = useMemo(() => {
    const uscite = transazioniFiltrateMese.filter((tr) => tr.tipo === 'uscita');
    return categorie
      .map((cat) => ({
        value: uscite.filter((tr) => tr.categoriaId === cat.id).reduce((s, tr) => s + tr.importo, 0),
        color: cat.colore,
        nome:  cat.nome,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transazioniFiltrateMese, categorie]);

  const datiLinea = useMemo(() => {
    const giorni = new Date(annoSel, meseSel + 1, 0).getDate();
    let cumulativo = 0;
    return Array.from({ length: giorni }, (_, i) => {
      const g = i + 1;
      const dataStr = `${chiaveMese}-${String(g).padStart(2, '0')}`;
      const ts = transazioniFiltrateMese.filter((tr) => tr.data === dataStr);
      cumulativo +=
        ts.filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0) -
        ts.filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0);
      const mostraLabel = g === 1 || g % 5 === 0 || g === giorni;
      return {
        value: cumulativo,
        label: mostraLabel ? String(g) : '',
        labelTextStyle: { fontSize: 9, color: t.piuSottile },
      };
    });
  }, [transazioniFiltrateMese, annoSel, meseSel, chiaveMese, t]);

  const chiaveMesePrec = useMemo(() =>
    meseSel === 0
      ? `${annoSel - 1}-12`
      : `${annoSel}-${String(meseSel).padStart(2, '0')}`,
    [annoSel, meseSel],
  );

  const transazioniFiltrateMesePrec = useMemo(
    () => transazioni.filter((tr) => !tr.ricorrente && tr.data.startsWith(chiaveMesePrec)),
    [transazioni, chiaveMesePrec],
  );

  const datiSettimanali = useMemo(() => {
    const giorni = new Date(annoSel, meseSel + 1, 0).getDate();
    return [
      { label: 'Sett 1', da: 1,  a: 7 },
      { label: 'Sett 2', da: 8,  a: 14 },
      { label: 'Sett 3', da: 15, a: 21 },
      { label: 'Sett 4', da: 22, a: giorni },
    ]
      .filter((s) => s.da <= giorni)
      .map((s) => ({
        value: transazioniFiltrateMese
          .filter((tr) => {
            const g = parseInt(tr.data.slice(8), 10);
            return tr.tipo === 'uscita' && g >= s.da && g <= s.a;
          })
          .reduce((acc, tr) => acc + tr.importo, 0),
        label: s.label,
        frontColor: t.viola,
        labelTextStyle: { fontSize: 9, color: t.piuSottile },
      }));
  }, [transazioniFiltrateMese, annoSel, meseSel, t]);

  const annoPrecTotali = useMemo(() => {
    const ts = transazioni.filter((tr) => !tr.ricorrente && tr.data.startsWith(String(annoSel - 1)));
    return {
      entrate: ts.filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0),
      uscite:  ts.filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0),
    };
  }, [transazioni, annoSel]);

  const totaleEntrateMese = useMemo(
    () => transazioniFiltrateMese.filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0),
    [transazioniFiltrateMese],
  );
  const totaleUsciteMese = useMemo(
    () => transazioniFiltrateMese.filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0),
    [transazioniFiltrateMese],
  );
  const saldoMese = totaleEntrateMese - totaleUsciteMese;

  const totaleEntrateAnno = mesiAnno.reduce((s, m) => s + m.entrate, 0);
  const totaleUsciteAnno  = mesiAnno.reduce((s, m) => s + m.uscite,  0);
  const saldoAnno         = totaleEntrateAnno - totaleUsciteAnno;

  const totaleEntrate = vista === 'mensile' ? totaleEntrateMese : totaleEntrateAnno;
  const totaleUscite  = vista === 'mensile' ? totaleUsciteMese  : totaleUsciteAnno;
  const saldo         = vista === 'mensile' ? saldoMese         : saldoAnno;

  if (transazioni.filter((tr) => !tr.ricorrente).length === 0) {
    return (
      <EmptyState
        messaggio={'Nessun dato da mostrare.\nAggiungi alcune transazioni per vedere i grafici.'}
        icona="bar-chart-outline"
      />
    );
  }

  const datiGruppati = mesiAnno.flatMap((m, i) => {
    const s = m.entrate - m.uscite;
    return [
      { value: m.entrate, frontColor: t.entrata,  label: MESI_BREVI[i], labelTextStyle: { fontSize: 9, color: t.piuSottile }, spacing: 2 },
      { value: m.uscite,  frontColor: t.uscita,   spacing: 2 },
      { value: Math.abs(s), frontColor: s >= 0 ? t.primario : t.arancio, spacing: 14 },
    ];
  });

  const maxUscitaCat    = Math.max(...datiCategorieAnno.map((d) => d.value), 1);
  const larghezzaGruppi = Math.max(LARGHEZZA_CHART, 12 * 54 + 40);
  const totaleUsciteTorta = datiTorta.reduce((s, d) => s + d.value, 0);
  const saldoFineLinea    = datiLinea.length > 0 ? datiLinea[datiLinea.length - 1].value : 0;
  const coloreLinea       = saldoFineLinea >= 0 ? t.primario : t.uscita;
  const datiTortaAnno     = datiCategorieAnno.map((d) => ({ value: d.value, color: d.colore, nome: d.nome }));

  const nomeMesePrec      = MESI[meseSel === 0 ? 11 : meseSel - 1];
  const entrateMesePrec   = transazioniFiltrateMesePrec.filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0);
  const usciteMesePrec    = transazioniFiltrateMesePrec.filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0);
  const datiConfrontoMese = [
    { value: totaleEntrateMese, frontColor: t.entrata,            label: 'Entrate', labelTextStyle: { fontSize: 9, color: t.piuSottile }, spacing: 4 },
    { value: entrateMesePrec,   frontColor: t.entrata + '60',     spacing: 24 },
    { value: totaleUsciteMese,  frontColor: t.uscita,             label: 'Uscite',  labelTextStyle: { fontSize: 9, color: t.piuSottile }, spacing: 4 },
    { value: usciteMesePrec,    frontColor: t.uscita + '60',      spacing: 0 },
  ];
  const datiTrendRisparmio = mesiAnno.map((m, i) => ({
    value: m.entrate - m.uscite,
    label: MESI_BREVI[i],
    labelTextStyle: { fontSize: 9, color: t.piuSottile },
  }));
  const hasDatiRisparmio  = datiTrendRisparmio.some((d) => d.value !== 0);
  const coloreRisparmio   = saldoAnno >= 0 ? t.entrata : t.uscita;
  const datiConfrontoAnno = [
    { value: totaleEntrateAnno,      frontColor: t.entrata,        label: 'Entrate', labelTextStyle: { fontSize: 9, color: t.piuSottile }, spacing: 4 },
    { value: annoPrecTotali.entrate, frontColor: t.entrata + '60', spacing: 24 },
    { value: totaleUsciteAnno,       frontColor: t.uscita,         label: 'Uscite',  labelTextStyle: { fontSize: 9, color: t.piuSottile }, spacing: 4 },
    { value: annoPrecTotali.uscite,  frontColor: t.uscita + '60',  spacing: 0 },
  ];

  return (
    <ScrollView style={stili.contenitore} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── Toggle + navigatore ── */}
      <View style={stili.controlliContenitore}>
        <View style={stili.toggle}>
          {(['mensile', 'annuale'] as Vista[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={[stili.toggleBtn, vista === v && stili.toggleBtnAttivo]}
              onPress={() => setVista(v)}
            >
              <Text style={[stili.toggleTesto, vista === v && stili.toggleTestoAttivo]}>
                {v === 'mensile' ? 'Mensile' : 'Annuale'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={stili.navigatore}>
          <TouchableOpacity onPress={() => naviga(-1)} hitSlop={10} style={stili.btnNav}>
            <Ionicons name="chevron-back" size={18} color={t.sottile} />
          </TouchableOpacity>
          <Text style={stili.labelPeriodo}>{labelPeriodo}</Text>
          <TouchableOpacity onPress={() => naviga(1)} hitSlop={10} style={stili.btnNav}>
            <Ionicons name="chevron-forward" size={18} color={t.sottile} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Cards sommario ── */}
      <View style={stili.sommario}>
        <View style={[stili.card, { backgroundColor: t.entrataSfondo }]}>
          <Ionicons name="arrow-up-circle-outline" size={16} color={t.entrata} />
          <Text style={[stili.cardTitolo, { color: t.entrata }]}>Entrate</Text>
          <Text style={[stili.cardValore, { color: t.entrata }]} numberOfLines={1}>
            {formatEuro(totaleEntrate)}
          </Text>
        </View>
        <View style={[stili.card, { backgroundColor: t.uscitaSfondo }]}>
          <Ionicons name="arrow-down-circle-outline" size={16} color={t.uscita} />
          <Text style={[stili.cardTitolo, { color: t.uscita }]}>Uscite</Text>
          <Text style={[stili.cardValore, { color: t.uscita }]} numberOfLines={1}>
            {formatEuro(totaleUscite)}
          </Text>
        </View>
        <View style={[stili.card, { backgroundColor: saldo >= 0 ? t.primarioSfondo : t.arancioSfondo }]}>
          <Ionicons name="stats-chart-outline" size={16} color={saldo >= 0 ? t.primario : t.arancio} />
          <Text style={[stili.cardTitolo, { color: saldo >= 0 ? t.primario : t.arancio }]}>Saldo</Text>
          <Text style={[stili.cardValore, { color: saldo >= 0 ? t.entrata : t.uscita }]} numberOfLines={1}>
            {formatEuro(saldo)}
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════ VISTA MENSILE ══════════════════════════════ */}
      {vista === 'mensile' && (
        <>
          {/* Torta donut */}
          <View style={stili.sezione}>
            <Text style={stili.titoloSezione}>Uscite per categoria — {MESI[meseSel]}</Text>

            {datiTorta.length > 0 ? (
              <>
                <View style={stili.centrato}>
                  <PieChart
                    data={datiTorta}
                    donut
                    radius={90}
                    innerRadius={54}
                    centerLabelComponent={() => (
                      <View style={stili.centroTorta}>
                        <Text style={stili.centroTortaTitolo}>Totale</Text>
                        <Text style={stili.centroTortaValore} numberOfLines={1}>
                          {formatEuro(totaleUsciteTorta)}
                        </Text>
                      </View>
                    )}
                  />
                </View>
                <View style={stili.legendaTorta}>
                  {datiTorta.map((d, i) => (
                    <View key={i} style={stili.voceLegendaTorta}>
                      <View style={[stili.puntino, { backgroundColor: d.color }]} />
                      <Text style={stili.nomeLegendaTorta} numberOfLines={1}>{d.nome}</Text>
                      <Text style={stili.valoreLegendaTorta}>{formatEuro(d.value)}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={stili.vuotoSezione}>Nessuna uscita in questo mese.</Text>
            )}
          </View>

          {/* Dettaglio categorie */}
          {datiTorta.length > 0 && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Dettaglio categorie — {MESI[meseSel]}</Text>
              <View style={stili.listaCategorie}>
                {datiTorta.map((d, i) => (
                  <View key={i} style={stili.rigaCategoria}>
                    <View style={stili.intestazioneCat}>
                      <View style={[stili.puntino, { backgroundColor: d.color }]} />
                      <Text style={stili.nomeCat} numberOfLines={1}>{d.nome}</Text>
                      <Text style={stili.valoreCat}>{formatEuro(d.value)}</Text>
                      <Text style={stili.percCat}>
                        {totaleUsciteTorta > 0 ? `${Math.round((d.value / totaleUsciteTorta) * 100)}%` : ''}
                      </Text>
                    </View>
                    <View style={stili.barraSfondo}>
                      <View style={[stili.barraRiempimento, {
                        width: `${(d.value / datiTorta[0].value) * 100}%`,
                        backgroundColor: d.color,
                      }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Confronto mese precedente */}
          {(totaleEntrateMese > 0 || totaleUsciteMese > 0 || entrateMesePrec > 0 || usciteMesePrec > 0) && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Confronto con {nomeMesePrec}</Text>
              <View style={stili.legenda}>
                {([
                  [t.entrata, `${MESI[meseSel]} (corrente)`],
                  [t.entrata + '60', `${nomeMesePrec} (prec.)`],
                ] as [string, string][]).map(([c, l]) => (
                  <View key={l} style={stili.voceLegenda}>
                    <View style={[stili.puntino, { backgroundColor: c }]} />
                    <Text style={stili.testoLegenda}>{l}</Text>
                  </View>
                ))}
              </View>
              <BarChart
                data={datiConfrontoMese}
                barWidth={26}
                barBorderRadius={4}
                yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                noOfSections={4}
                hideRules
                width={LARGHEZZA_CHART}
                disableScroll
              />
            </View>
          )}

          {/* Andamento settimanale */}
          {datiSettimanali.some((d) => d.value > 0) && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Spesa settimanale — {MESI[meseSel]}</Text>
              <BarChart
                data={datiSettimanali}
                barWidth={Math.floor((LARGHEZZA_CHART - 60) / 4)}
                barBorderRadius={8}
                yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                noOfSections={4}
                hideRules
                width={LARGHEZZA_CHART}
                disableScroll
              />
            </View>
          )}

          {/* Saldo cumulativo giornaliero */}
          <View style={stili.sezione}>
            <Text style={stili.titoloSezione}>Saldo cumulativo — {MESI[meseSel]}</Text>
            <Text style={[stili.sottotitoloSezione, { color: coloreLinea }]}>
              Fine mese: {saldoFineLinea >= 0 ? '+' : ''}{formatEuro(saldoFineLinea)}
            </Text>

            {datiLinea.some((d) => d.value !== 0) ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={datiLinea}
                  width={Math.max(LARGHEZZA_CHART, datiLinea.length * 22)}
                  height={160}
                  color={coloreLinea}
                  thickness={2}
                  areaChart
                  startFillColor={coloreLinea}
                  endFillColor={coloreLinea}
                  startOpacity={0.2}
                  endOpacity={0.02}
                  dataPointsColor={coloreLinea}
                  dataPointsRadius={3}
                  hideDataPoints={Platform.OS === 'web'}
                  yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                  noOfSections={4}
                  rulesColor={t.bordoSottile}
                  rulesType="solid"
                  disableScroll
                />
              </ScrollView>
            ) : (
              <Text style={stili.vuotoSezione}>Nessuna transazione in questo mese.</Text>
            )}
          </View>
        </>
      )}

      {/* ══════════════════════════════ VISTA ANNUALE ══════════════════════════════ */}
      {vista === 'annuale' && (
        <>
          {/* Istogramma 3 barre per mese */}
          <View style={stili.sezione}>
            <Text style={stili.titoloSezione}>Entrate, Uscite e Saldo — {annoSel}</Text>
            <View style={stili.legenda}>
              {([
                [t.entrata,  'Entrate'],
                [t.uscita,   'Uscite'],
                [t.primario, 'Saldo +'],
                [t.arancio,  'Saldo −'],
              ] as [string, string][]).map(([c, l]) => (
                <View key={l} style={stili.voceLegenda}>
                  <View style={[stili.puntino, { backgroundColor: c }]} />
                  <Text style={stili.testoLegenda}>{l}</Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={datiGruppati}
                barWidth={10}
                barBorderRadius={3}
                yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                noOfSections={4}
                hideRules
                width={larghezzaGruppi}
                disableScroll
              />
            </ScrollView>
          </View>

          {/* Trend risparmio */}
          {hasDatiRisparmio && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Trend risparmio mensile — {annoSel}</Text>
              <Text style={[stili.sottotitoloSezione, { color: coloreRisparmio }]}>
                Saldo totale: {saldoAnno >= 0 ? '+' : ''}{formatEuro(saldoAnno)}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={datiTrendRisparmio}
                  width={Math.max(LARGHEZZA_CHART, 12 * 48)}
                  height={160}
                  color={coloreRisparmio}
                  thickness={2}
                  areaChart
                  startFillColor={coloreRisparmio}
                  endFillColor={coloreRisparmio}
                  startOpacity={0.2}
                  endOpacity={0.02}
                  dataPointsColor={coloreRisparmio}
                  dataPointsRadius={3}
                  hideDataPoints={Platform.OS === 'web'}
                  yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                  noOfSections={4}
                  rulesColor={t.bordoSottile}
                  rulesType="solid"
                  disableScroll
                />
              </ScrollView>
            </View>
          )}

          {/* Confronto anno precedente */}
          {(totaleEntrateAnno > 0 || totaleUsciteAnno > 0 || annoPrecTotali.entrate > 0 || annoPrecTotali.uscite > 0) && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Confronto con {annoSel - 1}</Text>
              <View style={stili.legenda}>
                {([
                  [t.entrata,        `${annoSel} (corrente)`],
                  [t.entrata + '60', `${annoSel - 1} (prec.)`],
                ] as [string, string][]).map(([c, l]) => (
                  <View key={l} style={stili.voceLegenda}>
                    <View style={[stili.puntino, { backgroundColor: c }]} />
                    <Text style={stili.testoLegenda}>{l}</Text>
                  </View>
                ))}
              </View>
              <BarChart
                data={datiConfrontoAnno}
                barWidth={28}
                barBorderRadius={4}
                yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                noOfSections={4}
                hideRules
                width={LARGHEZZA_CHART}
                disableScroll
              />
            </View>
          )}

          {/* Torta distribuzione annuale */}
          {datiTortaAnno.length > 0 && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Distribuzione uscite — {annoSel}</Text>
              <View style={stili.centrato}>
                <PieChart
                  data={datiTortaAnno}
                  donut
                  radius={90}
                  innerRadius={54}
                  centerLabelComponent={() => (
                    <View style={stili.centroTorta}>
                      <Text style={stili.centroTortaTitolo}>Totale</Text>
                      <Text style={stili.centroTortaValore} numberOfLines={1}>
                        {formatEuro(totaleUsciteAnno)}
                      </Text>
                    </View>
                  )}
                />
              </View>
              <View style={stili.legendaTorta}>
                {datiTortaAnno.map((d, i) => (
                  <View key={i} style={stili.voceLegendaTorta}>
                    <View style={[stili.puntino, { backgroundColor: d.color }]} />
                    <Text style={stili.nomeLegendaTorta} numberOfLines={1}>{d.nome}</Text>
                    <Text style={stili.valoreLegendaTorta}>{formatEuro(d.value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Barre uscite per categoria */}
          {datiCategorieAnno.length > 0 && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Uscite per categoria — {annoSel}</Text>
              <View style={stili.listaCategorie}>
                {datiCategorieAnno.map((d) => (
                  <View key={d.id} style={stili.rigaCategoria}>
                    <View style={stili.intestazioneCat}>
                      <View style={[stili.puntino, { backgroundColor: d.colore }]} />
                      <Text style={stili.nomeCat} numberOfLines={1}>{d.nome}</Text>
                      <Text style={stili.valoreCat}>{formatEuro(d.value)}</Text>
                      <Text style={stili.percCat}>
                        {totaleUsciteAnno > 0 ? `${Math.round((d.value / totaleUsciteAnno) * 100)}%` : ''}
                      </Text>
                    </View>
                    <View style={stili.barraSfondo}>
                      <View
                        style={[
                          stili.barraRiempimento,
                          { width: `${(d.value / maxUscitaCat) * 100}%`, backgroundColor: d.colore },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

    </ScrollView>
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

    // ── Cards sommario ──
    sommario: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
      marginBottom: 4,
    },
    card: {
      flex: 1,
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    cardTitolo: {
      fontSize: 11,
      fontWeight: '600',
    },
    cardValore: {
      fontSize: 13,
      fontWeight: '700',
    },

    // ── Sezione generica ──
    sezione: {
      backgroundColor: t.carta,
      margin: 16,
      marginBottom: 0,
      borderRadius: 20,
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
      marginBottom: 4,
    },
    sottotitoloSezione: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 12,
    },
    vuotoSezione: {
      textAlign: 'center',
      color: t.piuSottile,
      paddingVertical: 20,
      fontSize: 14,
    },
    centrato: {
      alignItems: 'center',
      marginVertical: 12,
    },

    // ── Torta donut ──
    centroTorta: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centroTortaTitolo: {
      fontSize: 11,
      color: t.piuSottile,
      fontWeight: '500',
    },
    centroTortaValore: {
      fontSize: 13,
      fontWeight: '700',
      color: t.titolo,
    },
    legendaTorta: {
      gap: 8,
      marginTop: 4,
    },
    voceLegendaTorta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nomeLegendaTorta: {
      flex: 1,
      fontSize: 13,
      color: t.corpo,
    },
    valoreLegendaTorta: {
      fontSize: 13,
      fontWeight: '600',
      color: t.titolo,
    },

    // ── Legenda barre ──
    legenda: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    voceLegenda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    puntino: {
      width: 9,
      height: 9,
      borderRadius: 5,
      flexShrink: 0,
    },
    testoLegenda: {
      fontSize: 12,
      color: t.sottile,
    },

    // ── Categorie barre orizzontali ──
    listaCategorie: {
      gap: 14,
    },
    rigaCategoria: {
      gap: 6,
    },
    intestazioneCat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nomeCat: {
      flex: 1,
      fontSize: 13,
      color: t.corpo,
      fontWeight: '500',
    },
    valoreCat: {
      fontSize: 13,
      color: t.titolo,
      fontWeight: '700',
    },
    percCat: {
      fontSize: 11,
      color: t.piuSottile,
      width: 32,
      textAlign: 'right',
    },
    barraSfondo: {
      height: 7,
      backgroundColor: t.bordoSottile,
      borderRadius: 4,
      overflow: 'hidden',
    },
    barraRiempimento: {
      height: 7,
      borderRadius: 4,
      opacity: 0.85,
    },
  });
}
