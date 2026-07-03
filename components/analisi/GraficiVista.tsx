// ── Vista "Grafici" della schermata Analisi: torta + linee + barre ──
import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform, TouchableOpacity, useWindowDimensions, RefreshControl } from 'react-native';
import Text from '../TestoBase';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { Tema } from '../../constants/tema';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { formatEuro } from '../../utils/formatters';
import { creaPointerConfig } from '../../utils/pointerConfig';
import { Categoria, Transazione } from '../../types';
import SankeyFlusso, { NodoSankey } from './SankeyFlusso';

const MESI       = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MESI_BREVI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

type Vista = 'mensile' | 'annuale';

interface Props {
  transazioni: Transazione[];
  categorie: Categoria[];
  t: Tema;
  vista: Vista;
  anno: number;
  mese: number;
}

export default function GraficiVista({ transazioni, categorie, t, vista, anno, mese }: Props) {
  const stili = useMemo(() => creaStili(t), [t]);
  const { refreshing, onRefresh } = usePullToRefresh();

  // Indice della fetta della torta toccata dall'utente — null quando nessuna è selezionata
  const [focoTortaMese, setFocoTortaMese] = useState<number | null>(null);
  const [focoTortaAnno, setFocoTortaAnno] = useState<number | null>(null);

  // Indice della barra toccata nei vari istogrammi — null quando nessuna è selezionata
  const [barraConfrontoMese, setBarraConfrontoMese]   = useState<number | null>(null);
  const [barraConfrontoAnno, setBarraConfrontoAnno]   = useState<number | null>(null);

  const { width: LARGHEZZA } = useWindowDimensions();
  // margini sezione (16×2=32) + padding sezione (20×2=40) + asse-y gifted-charts (35) = 107
  const LARGHEZZA_CHART = LARGHEZZA - 108;

  const annoSel = anno;
  const meseSel = mese;

  const mesiAnno = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const chiave = `${annoSel}-${String(i + 1).padStart(2, '0')}`;
      const ts = transazioni.filter((tr) => !tr.ricorrente && !tr.trasferimento && tr.data.startsWith(chiave));
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
          .filter((tr) => !tr.ricorrente && !tr.trasferimento && tr.tipo === 'uscita' && tr.categoriaId === cat.id && tr.data.startsWith(String(annoSel)))
          .reduce((s, tr) => s + tr.importo, 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    [transazioni, categorie, annoSel],
  );

  // Deselezionare la fetta/barra quando cambia il periodo, altrimenti l'indice punterebbe a un altro dato
  useEffect(() => { setFocoTortaMese(null); setBarraConfrontoMese(null); }, [annoSel, meseSel]);
  useEffect(() => { setFocoTortaAnno(null); setBarraConfrontoAnno(null); }, [annoSel]);

  const chiaveMese = `${annoSel}-${String(meseSel + 1).padStart(2, '0')}`;

  const transazioniFiltrateMese = useMemo(
    () => transazioni.filter((tr) => !tr.ricorrente && !tr.trasferimento && tr.data.startsWith(chiaveMese)),
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
        etichettaTooltip: `Giorno ${g}`,
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
    () => transazioni.filter((tr) => !tr.ricorrente && !tr.trasferimento && tr.data.startsWith(chiaveMesePrec)),
    [transazioni, chiaveMesePrec],
  );

  // Entrate/uscite/saldo per settimana del mese — stesso pattern di "datiGruppati" per l'anno,
  // così il cash flow si legge in un colpo d'occhio anche a livello di singola settimana
  const datiSettimanali = useMemo(() => {
    const giorni = new Date(annoSel, meseSel + 1, 0).getDate();
    return [
      { label: 'Sett 1', da: 1,  a: 7 },
      { label: 'Sett 2', da: 8,  a: 14 },
      { label: 'Sett 3', da: 15, a: 21 },
      { label: 'Sett 4', da: 22, a: giorni },
    ]
      .filter((s) => s.da <= giorni)
      .map((s) => {
        const ts = transazioniFiltrateMese.filter((tr) => {
          const g = parseInt(tr.data.slice(8), 10);
          return g >= s.da && g <= s.a;
        });
        return {
          label: s.label,
          entrate: ts.filter((tr) => tr.tipo === 'entrata').reduce((acc, tr) => acc + tr.importo, 0),
          uscite:  ts.filter((tr) => tr.tipo === 'uscita').reduce((acc, tr) => acc + tr.importo, 0),
        };
      });
  }, [transazioniFiltrateMese, annoSel, meseSel]);

  const datiSettimanaliGruppati = datiSettimanali.flatMap((s) => {
    const saldo = s.entrate - s.uscite;
    return [
      { value: s.entrate, frontColor: t.entrata, label: s.label, labelTextStyle: { fontSize: 9, color: t.piuSottile }, spacing: 2 },
      { value: s.uscite,  frontColor: t.uscita,  spacing: 2 },
      { value: Math.abs(saldo), frontColor: saldo >= 0 ? t.primario : t.arancio, spacing: 14 },
    ];
  });
  const larghezzaSettimane = Math.max(LARGHEZZA_CHART, datiSettimanali.length * 54 + 40);

  const annoPrecTotali = useMemo(() => {
    const ts = transazioni.filter((tr) => !tr.ricorrente && !tr.trasferimento && tr.data.startsWith(String(annoSel - 1)));
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

  const totaleEntrateAnno = mesiAnno.reduce((s, m) => s + m.entrate, 0);
  const totaleUsciteAnno  = mesiAnno.reduce((s, m) => s + m.uscite,  0);
  const saldoAnno         = totaleEntrateAnno - totaleUsciteAnno;

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

  // Sankey "Entrate → categorie di spesa + risparmio": visibile solo con avanzo positivo,
  // altrimenti la conservazione del flusso (entrate = uscite + risparmio) non torna
  const avanzoMese = totaleEntrateMese - totaleUsciteMese;
  const destinazioniMese: NodoSankey[] = avanzoMese > 0
    ? [...datiTorta.map((d) => ({ nome: d.nome, valore: d.value, colore: d.color })), { nome: 'Risparmio', valore: avanzoMese, colore: t.primario }]
    : [];
  const destinazioniAnno: NodoSankey[] = saldoAnno > 0
    ? [...datiTortaAnno.map((d) => ({ nome: d.nome, valore: d.value, colore: d.color })), { nome: 'Risparmio', valore: saldoAnno, colore: t.primario }]
    : [];

  const nomeMesePrec      = MESI[meseSel === 0 ? 11 : meseSel - 1];
  const entrateMesePrec   = transazioniFiltrateMesePrec.filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0);
  const usciteMesePrec    = transazioniFiltrateMesePrec.filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0);
  const datiConfrontoMese = [
    { value: totaleEntrateMese, frontColor: t.entrata,            label: 'Entrate', labelTextStyle: { fontSize: 9, color: t.piuSottile }, spacing: 4 },
    { value: entrateMesePrec,   frontColor: t.entrata + '60',     spacing: 24 },
    { value: totaleUsciteMese,  frontColor: t.uscita,             label: 'Uscite',  labelTextStyle: { fontSize: 9, color: t.piuSottile }, spacing: 4 },
    { value: usciteMesePrec,    frontColor: t.uscita + '60',      spacing: 0 },
  ];
  const etichetteConfrontoMese = [
    `Entrate — ${MESI[meseSel]}`, `Entrate — ${nomeMesePrec}`,
    `Uscite — ${MESI[meseSel]}`,  `Uscite — ${nomeMesePrec}`,
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
  const etichetteConfrontoAnno = [
    `Entrate — ${annoSel}`, `Entrate — ${annoSel - 1}`,
    `Uscite — ${annoSel}`,  `Uscite — ${annoSel - 1}`,
  ];

  return (
    <ScrollView
      style={stili.contenitore}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primario} colors={[t.primario]} />}
    >

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
                    innerCircleColor={t.carta}
                    onPress={(_item: unknown, index: number) =>
                      setFocoTortaMese((prec) => (prec === index ? null : index))
                    }
                    centerLabelComponent={() => {
                      const sel = focoTortaMese != null ? datiTorta[focoTortaMese] : null;
                      const perc = sel && totaleUsciteTorta > 0 ? Math.round((sel.value / totaleUsciteTorta) * 100) : null;
                      return (
                        <View style={stili.centroTorta}>
                          <Text style={stili.centroTortaTitolo} numberOfLines={1}>{sel ? sel.nome : 'Totale'}</Text>
                          <Text style={stili.centroTortaValore} numberOfLines={1}>
                            {formatEuro(sel ? sel.value : totaleUsciteTorta)}
                          </Text>
                          {perc != null && <Text style={stili.centroTortaPerc}>{perc}% del totale</Text>}
                        </View>
                      );
                    }}
                  />
                </View>
                <Text style={stili.suggerimentoTorta}>Tocca una fetta per il dettaglio</Text>
                <View style={stili.legendaTorta}>
                  {datiTorta.map((d, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.6}
                      style={stili.voceLegendaTorta}
                      onPress={() => setFocoTortaMese((prec) => (prec === i ? null : i))}
                    >
                      <View style={[stili.puntino, { backgroundColor: d.color }]} />
                      <Text style={[stili.nomeLegendaTorta, i === focoTortaMese && { fontWeight: '700', color: t.titolo }]} numberOfLines={1}>{d.nome}</Text>
                      <Text style={stili.valoreLegendaTorta}>{formatEuro(d.value)}</Text>
                    </TouchableOpacity>
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
              {barraConfrontoMese != null && (
                <Text style={stili.calloutBarra}>
                  {etichetteConfrontoMese[barraConfrontoMese]}: <Text style={stili.calloutBarraValore}>{formatEuro(datiConfrontoMese[barraConfrontoMese].value)}</Text>
                </Text>
              )}
              <BarChart
                data={datiConfrontoMese}
                barWidth={26}
                barBorderRadius={4}
                yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                yAxisWidth={35}
                noOfSections={4}
                hideRules
                width={LARGHEZZA_CHART}
                disableScroll
                onPress={(_item: unknown, index: number) =>
                  setBarraConfrontoMese((prec) => (prec === index ? null : index))
                }
              />
            </View>
          )}

          {/* Flusso del denaro */}
          {destinazioniMese.length > 0 && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Flusso del denaro — {MESI[meseSel]}</Text>
              <View style={stili.centrato}>
                <SankeyFlusso entrate={totaleEntrateMese} destinazioni={destinazioniMese} t={t} larghezza={LARGHEZZA_CHART} />
              </View>
              <View style={stili.legendaTorta}>
                <View style={stili.voceLegendaTorta}>
                  <View style={[stili.puntino, { backgroundColor: t.entrata }]} />
                  <Text style={stili.nomeLegendaTorta}>Entrate</Text>
                  <Text style={stili.valoreLegendaTorta}>{formatEuro(totaleEntrateMese)}</Text>
                </View>
                {destinazioniMese.map((d, i) => (
                  <View key={i} style={stili.voceLegendaTorta}>
                    <View style={[stili.puntino, { backgroundColor: d.colore }]} />
                    <Text style={stili.nomeLegendaTorta} numberOfLines={1}>{d.nome}</Text>
                    <Text style={stili.valoreLegendaTorta}>{formatEuro(d.valore)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cash flow settimanale */}
          {datiSettimanali.some((d) => d.entrate > 0 || d.uscite > 0) && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Cash flow settimanale — {MESI[meseSel]}</Text>
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
                  data={datiSettimanaliGruppati}
                  barWidth={16}
                  labelWidth={48}
                  barBorderRadius={4}
                  yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                  yAxisWidth={35}
                  noOfSections={4}
                  hideRules
                  width={larghezzaSettimane}
                  disableScroll
                />
              </ScrollView>
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
                  pointerConfig={creaPointerConfig(t, coloreLinea, 160)}
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
                labelWidth={40}
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
                  pointerConfig={creaPointerConfig(t, coloreRisparmio, 160)}
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
              {barraConfrontoAnno != null && (
                <Text style={stili.calloutBarra}>
                  {etichetteConfrontoAnno[barraConfrontoAnno]}: <Text style={stili.calloutBarraValore}>{formatEuro(datiConfrontoAnno[barraConfrontoAnno].value)}</Text>
                </Text>
              )}
              <BarChart
                data={datiConfrontoAnno}
                barWidth={28}
                barBorderRadius={4}
                yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
                yAxisWidth={35}
                noOfSections={4}
                hideRules
                width={LARGHEZZA_CHART}
                disableScroll
                onPress={(_item: unknown, index: number) =>
                  setBarraConfrontoAnno((prec) => (prec === index ? null : index))
                }
              />
            </View>
          )}

          {/* Flusso del denaro */}
          {destinazioniAnno.length > 0 && (
            <View style={stili.sezione}>
              <Text style={stili.titoloSezione}>Flusso del denaro — {annoSel}</Text>
              <View style={stili.centrato}>
                <SankeyFlusso entrate={totaleEntrateAnno} destinazioni={destinazioniAnno} t={t} larghezza={LARGHEZZA_CHART} />
              </View>
              <View style={stili.legendaTorta}>
                <View style={stili.voceLegendaTorta}>
                  <View style={[stili.puntino, { backgroundColor: t.entrata }]} />
                  <Text style={stili.nomeLegendaTorta}>Entrate</Text>
                  <Text style={stili.valoreLegendaTorta}>{formatEuro(totaleEntrateAnno)}</Text>
                </View>
                {destinazioniAnno.map((d, i) => (
                  <View key={i} style={stili.voceLegendaTorta}>
                    <View style={[stili.puntino, { backgroundColor: d.colore }]} />
                    <Text style={stili.nomeLegendaTorta} numberOfLines={1}>{d.nome}</Text>
                    <Text style={stili.valoreLegendaTorta}>{formatEuro(d.valore)}</Text>
                  </View>
                ))}
              </View>
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
                  innerCircleColor={t.carta}
                  onPress={(_item: unknown, index: number) =>
                    setFocoTortaAnno((prec) => (prec === index ? null : index))
                  }
                  centerLabelComponent={() => {
                    const sel = focoTortaAnno != null ? datiTortaAnno[focoTortaAnno] : null;
                    const perc = sel && totaleUsciteAnno > 0 ? Math.round((sel.value / totaleUsciteAnno) * 100) : null;
                    return (
                      <View style={stili.centroTorta}>
                        <Text style={stili.centroTortaTitolo} numberOfLines={1}>{sel ? sel.nome : 'Totale'}</Text>
                        <Text style={stili.centroTortaValore} numberOfLines={1}>
                          {formatEuro(sel ? sel.value : totaleUsciteAnno)}
                        </Text>
                        {perc != null && <Text style={stili.centroTortaPerc}>{perc}% del totale</Text>}
                      </View>
                    );
                  }}
                />
              </View>
              <Text style={stili.suggerimentoTorta}>Tocca una fetta per il dettaglio</Text>
              <View style={stili.legendaTorta}>
                {datiTortaAnno.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.6}
                    style={stili.voceLegendaTorta}
                    onPress={() => setFocoTortaAnno((prec) => (prec === i ? null : i))}
                  >
                    <View style={[stili.puntino, { backgroundColor: d.color }]} />
                    <Text style={[stili.nomeLegendaTorta, i === focoTortaAnno && { fontWeight: '700', color: t.titolo }]} numberOfLines={1}>{d.nome}</Text>
                    <Text style={stili.valoreLegendaTorta}>{formatEuro(d.value)}</Text>
                  </TouchableOpacity>
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

    // ── Sezione generica ──
    sezione: {
      backgroundColor: t.carta,
      margin: 16,
      marginBottom: 0,
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
      marginBottom: 4,
    },
    sottotitoloSezione: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 12,
    },
    calloutBarra: {
      fontSize: 12,
      color: t.sottile,
      marginBottom: 8,
    },
    calloutBarraValore: {
      fontWeight: '700',
      color: t.titolo,
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
    centroTortaPerc: {
      fontSize: 10,
      fontWeight: '600',
      color: t.piuSottile,
      marginTop: 1,
    },
    suggerimentoTorta: {
      textAlign: 'center',
      fontSize: 11,
      color: t.piuSottile,
      marginTop: 2,
      marginBottom: 8,
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
