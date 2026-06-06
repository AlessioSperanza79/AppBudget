// ── Schermata Analisi: tabelle con drill-down per categoria ──
import { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, FlatList, StyleSheet, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Categoria, Istituto, Transazione } from '../../types';
import { formatEuro } from '../../utils/formatters';
import TransactionItem from '../../components/TransactionItem';
import { useTema, Tema } from '../../constants/tema';

type VistaAnalisi = 'mensile' | 'annuale';

const MESI_INTERI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

// ────────────────────────────────────────────────────────────────────────────
// Tipi interni

interface RigaCategoria {
  categoriaId: string;
  categoria: Categoria | undefined;
  importo: number;
  conteggio: number;
}

interface RigaIstituto {
  istitutoId: string;
  istituto: Istituto | undefined;
  importoEntrate: number;
  importoUscite: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Funzioni di aggregazione (fuori dal componente per stabilità referenziale)

function calcolaRigheCategoria(
  transazioni: Transazione[],
  categorie: Categoria[],
  tipo: 'entrata' | 'uscita',
): RigaCategoria[] {
  const totali = new Map<string, number>();
  const conti  = new Map<string, number>();
  for (const tr of transazioni) {
    if (tr.tipo !== tipo) continue;
    totali.set(tr.categoriaId, (totali.get(tr.categoriaId) ?? 0) + tr.importo);
    conti.set(tr.categoriaId,  (conti.get(tr.categoriaId)  ?? 0) + 1);
  }
  return [...totali.entries()]
    .map(([categoriaId, importo]) => ({
      categoriaId,
      categoria: categorie.find((c) => c.id === categoriaId),
      importo,
      conteggio: conti.get(categoriaId) ?? 0,
    }))
    .sort((a, b) => b.importo - a.importo);
}

function calcolaRigheIstituto(
  transazioni: Transazione[],
  istituti: Istituto[],
): RigaIstituto[] {
  const mappa = new Map<string, { entrate: number; uscite: number }>();
  for (const tr of transazioni) {
    if (!tr.istitutoId) continue;
    const curr = mappa.get(tr.istitutoId) ?? { entrate: 0, uscite: 0 };
    if (tr.tipo === 'entrata') curr.entrate += tr.importo;
    else curr.uscite += tr.importo;
    mappa.set(tr.istitutoId, curr);
  }
  return [...mappa.entries()]
    .map(([istitutoId, v]) => ({
      istitutoId,
      istituto: istituti.find((i) => i.id === istitutoId),
      importoEntrate: v.entrate,
      importoUscite:  v.uscite,
    }))
    .sort((a, b) => (b.importoEntrate + b.importoUscite) - (a.importoEntrate + a.importoUscite));
}

// ────────────────────────────────────────────────────────────────────────────
// Componente principale

export default function AnalisiScreen() {
  const { transazioni, categorie, istituti, aggiornaBudgetCategoria } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const oggi = new Date();
  const [vista, setVista] = useState<VistaAnalisi>('annuale');
  const [anno,  setAnno]  = useState(oggi.getFullYear());
  const [mese,  setMese]  = useState(oggi.getMonth());

  const [dettaglio, setDettaglio] = useState<{
    categoriaId: string;
    categoria: Categoria | undefined;
    tipo: 'entrata' | 'uscita';
  } | undefined>();

  const [dettaglioIstituto, setDettaglioIstituto] = useState<{
    istitutoId: string;
    istituto: Istituto | undefined;
  } | undefined>();

  const [budgetInput, setBudgetInput] = useState('');
  useEffect(() => {
    if (dettaglio?.tipo === 'uscita') {
      const b = dettaglio.categoria?.budgetMensile;
      setBudgetInput(b != null ? String(b) : '');
    }
  }, [dettaglio]);

  // ── Filtro periodo (escludi sempre i template ricorrenti) ──
  const transazioniFiltrate = useMemo(() => {
    const base = transazioni.filter((tr) => !tr.ricorrente);
    if (vista === 'annuale') {
      return base.filter((tr) => tr.data.startsWith(String(anno)));
    }
    const mm = String(mese + 1).padStart(2, '0');
    return base.filter((tr) => tr.data.startsWith(`${anno}-${mm}`));
  }, [transazioni, vista, anno, mese]);

  const righeUscite   = useMemo(() => calcolaRigheCategoria(transazioniFiltrate, categorie, 'uscita'),  [transazioniFiltrate, categorie]);
  const righeEntrate  = useMemo(() => calcolaRigheCategoria(transazioniFiltrate, categorie, 'entrata'), [transazioniFiltrate, categorie]);
  const righeIstituti = useMemo(() => calcolaRigheIstituto(transazioniFiltrate, istituti),              [transazioniFiltrate, istituti]);

  const totaleUscite  = righeUscite.reduce((s, r) => s + r.importo, 0);
  const totaleEntrate = righeEntrate.reduce((s, r) => s + r.importo, 0);
  const saldo = totaleEntrate - totaleUscite;

  // ── Confronto mese precedente (solo vista mensile) ──
  const transazioniMesePrecedente = useMemo(() => {
    if (vista !== 'mensile') return [];
    const mp = mese === 0 ? 11 : mese - 1;
    const ap = mese === 0 ? anno - 1 : anno;
    const mm = String(mp + 1).padStart(2, '0');
    return transazioni.filter((tr) => !tr.ricorrente && tr.data.startsWith(`${ap}-${mm}`));
  }, [transazioni, vista, anno, mese]);

  const righeUscitePrecedenti = useMemo(
    () => calcolaRigheCategoria(transazioniMesePrecedente, categorie, 'uscita'),
    [transazioniMesePrecedente, categorie],
  );

  const mappaImportiPrecedenti = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of righeUscitePrecedenti) map.set(r.categoriaId, r.importo);
    return map;
  }, [righeUscitePrecedenti]);

  const topCrescite = useMemo(() => {
    if (vista !== 'mensile') return [];
    return righeUscite
      .filter((r) => {
        const prev = mappaImportiPrecedenti.get(r.categoriaId) ?? 0;
        return prev > 0 && r.importo > prev;
      })
      .map((r) => {
        const prev = mappaImportiPrecedenti.get(r.categoriaId)!;
        return {
          nome:    r.categoria?.nome  ?? '—',
          colore:  r.categoria?.colore ?? t.piuSottile,
          importo: r.importo,
          prev,
          delta: ((r.importo - prev) / prev) * 100,
        };
      })
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3);
  }, [righeUscite, mappaImportiPrecedenti, vista, t]);

  const periodoLabel = vista === 'annuale'
    ? String(anno)
    : `${MESI_INTERI[mese]} ${anno}`;

  const mesePrecLabel = MESI_INTERI[mese === 0 ? 11 : mese - 1];

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

  const tassoRisparmio = totaleEntrate > 0 ? (saldo / totaleEntrate) * 100 : 0;

  const proiezioneFineAnno = useMemo(() => {
    if (vista !== 'annuale') return null;
    const adesso = new Date();
    if (anno !== adesso.getFullYear()) return null;
    const mesCorrente = adesso.getMonth();
    if (mesCorrente === 0) return null;

    const saldiMensili: number[] = [];
    for (let m = 0; m <= mesCorrente; m++) {
      const chiave = `${anno}-${String(m + 1).padStart(2, '00')}`;
      const ts = transazioni.filter((tr) => tr.data.startsWith(chiave));
      if (ts.length === 0) continue;
      saldiMensili.push(
        ts.reduce((acc, tr) => acc + (tr.tipo === 'entrata' ? tr.importo : -tr.importo), 0),
      );
    }
    if (saldiMensili.length < 2) return null;

    const ultimi = saldiMensili.slice(-3);
    const mediaMensile = ultimi.reduce((s, v) => s + v, 0) / ultimi.length;
    const mesiRimanenti = 11 - mesCorrente;
    if (mesiRimanenti === 0) return null;

    return saldo + mediaMensile * mesiRimanenti;
  }, [transazioni, vista, anno, saldo]);

  const alerteBudget = useMemo(() => {
    if (vista !== 'mensile') return [];
    return righeUscite
      .filter((r) => {
        const budget = r.categoria?.budgetMensile;
        return budget != null && r.importo / budget >= 0.8;
      })
      .map((r) => ({
        nome: r.categoria?.nome ?? '—',
        importo: r.importo,
        budget: r.categoria!.budgetMensile!,
        perc: (r.importo / r.categoria!.budgetMensile!) * 100,
      }));
  }, [righeUscite, vista]);

  const transazioniDettaglio = useMemo(() => {
    if (!dettaglio) return [];
    return transazioniFiltrate
      .filter((tr) => tr.categoriaId === dettaglio.categoriaId && tr.tipo === dettaglio.tipo)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [dettaglio, transazioniFiltrate]);

  const transazioniDettaglioIstituto = useMemo(() => {
    if (!dettaglioIstituto) return [];
    return transazioniFiltrate
      .filter((tr) => tr.istitutoId === dettaglioIstituto.istitutoId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [dettaglioIstituto, transazioniFiltrate]);

  const esportaCSV = () => {
    const intestazione = 'Data,Tipo,Importo,Categoria,Nota,Istituto';
    const righe = transazioniFiltrate.map((tr) => {
      const cat = categorie.find((c) => c.id === tr.categoriaId)?.nome ?? '';
      const ist = istituti.find((i) => i.id === tr.istitutoId)?.nome ?? '';
      const nota = (tr.nota ?? '').replace(/"/g, '""');
      return `${tr.data},${tr.tipo},${tr.importo},"${cat}","${nota}","${ist}"`;
    });
    const csv = [intestazione, ...righe].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transazioni_${periodoLabel.replace(/\s/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <View style={stili.contenitore}>

      {/* ── Toggle Mensile / Annuale ── */}
      <View style={stili.toggleContenitore}>
        {(['mensile', 'annuale'] as VistaAnalisi[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[stili.tab, vista === v && stili.tabAttivo]}
            onPress={() => setVista(v)}
          >
            <Text style={[stili.testoTab, vista === v && stili.testoTabAttivo]}>
              {v === 'mensile' ? 'Mensile' : 'Annuale'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Navigatore periodo ── */}
      <View style={stili.navigatoreContenitore}>
        <TouchableOpacity onPress={navigaPrecedente} hitSlop={12} style={stili.btnNav}>
          <Ionicons name="chevron-back" size={18} color={t.sottile} />
        </TouchableOpacity>
        <Text style={stili.testoPeriodo}>{periodoLabel}</Text>
        <TouchableOpacity onPress={navigaSuccessivo} hitSlop={12} style={stili.btnNav}>
          <Ionicons name="chevron-forward" size={18} color={t.sottile} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Card saldo / entrate / uscite ── */}
        <View style={stili.rigaCard}>
          <View style={[stili.card, { backgroundColor: t.entrataSfondo }]}>
            <View style={stili.rigaIconCard}>
              <Ionicons name="arrow-up-circle-outline" size={14} color={t.entrata} />
              <Text style={[stili.etichettaCard, { color: t.entrata }]}>Entrate</Text>
            </View>
            <Text style={[stili.valoreCard, { color: t.entrata }]}>{formatEuro(totaleEntrate)}</Text>
          </View>
          <View style={[stili.card, { backgroundColor: t.uscitaSfondo }]}>
            <View style={stili.rigaIconCard}>
              <Ionicons name="arrow-down-circle-outline" size={14} color={t.uscita} />
              <Text style={[stili.etichettaCard, { color: t.uscita }]}>Uscite</Text>
            </View>
            <Text style={[stili.valoreCard, { color: t.uscita }]}>{formatEuro(totaleUscite)}</Text>
          </View>
          <View style={[stili.card, { backgroundColor: saldo >= 0 ? t.primarioSfondo : t.arancioSfondo }]}>
            <View style={stili.rigaIconCard}>
              <Ionicons
                name={saldo >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
                size={14}
                color={saldo >= 0 ? t.primario : t.arancio}
              />
              <Text style={[stili.etichettaCard, { color: saldo >= 0 ? t.primario : t.arancio }]}>Saldo</Text>
            </View>
            <Text style={[stili.valoreCard, { color: saldo >= 0 ? t.primario : t.arancio }]}>
              {formatEuro(saldo)}
            </Text>
          </View>
        </View>

        {/* ── Tasso di risparmio ── */}
        <View style={stili.cardMetrica}>
          <Text style={stili.etichettaMetrica}>Tasso di risparmio</Text>
          <Text style={[stili.valoreMetrica, { color: tassoRisparmio >= 0 ? t.entrata : t.uscita }]}>
            {tassoRisparmio >= 0 ? '+' : ''}{tassoRisparmio.toFixed(1)}%
          </Text>
        </View>

        {vista === 'mensile' && (
          <View style={stili.cardMetrica}>
            <Text style={stili.etichettaMetrica}>Risparmio del mese</Text>
            <Text style={[stili.valoreMetrica, { color: saldo >= 0 ? t.entrata : t.uscita }]}>
              {saldo >= 0 ? '+' : ''}{formatEuro(saldo)}
            </Text>
          </View>
        )}

        {vista === 'annuale' && (
          <View style={stili.cardMetrica}>
            <Text style={stili.etichettaMetrica}>Risparmio medio mensile</Text>
            <Text style={[stili.valoreMetrica, { color: saldo >= 0 ? t.entrata : t.uscita }]}>
              {saldo >= 0 ? '+' : ''}{formatEuro(saldo / 12)}
            </Text>
          </View>
        )}

        {proiezioneFineAnno !== null && (
          <View style={stili.cardMetrica}>
            <View>
              <Text style={stili.etichettaMetrica}>Proiezione fine anno</Text>
              <Text style={stili.notaMetrica}>Media ultimi 3 mesi</Text>
            </View>
            <Text style={[stili.valoreMetrica, { color: proiezioneFineAnno >= 0 ? t.entrata : t.uscita }]}>
              {proiezioneFineAnno >= 0 ? '+' : ''}{formatEuro(proiezioneFineAnno)}
            </Text>
          </View>
        )}

        {/* ── Alert budget (solo vista mensile) ── */}
        {alerteBudget.length > 0 && (
          <View style={stili.bannerAlert}>
            <Ionicons name="warning" size={16} color={t.arancio} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={stili.titoloAlert}>Attenzione al budget</Text>
              {alerteBudget.map((a, i) => (
                <Text key={i} style={[stili.voceAlert, { color: a.perc >= 100 ? t.uscita : t.arancio }]}>
                  • {a.nome}: {formatEuro(a.importo)} / {formatEuro(a.budget)} ({Math.round(a.perc)}%)
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── Top crescite vs mese precedente (solo vista mensile) ── */}
        {vista === 'mensile' && topCrescite.length > 0 && (
          <View style={stili.boxTopCrescite}>
            <Text style={stili.titoloTopCrescite}>
              Categorie cresciute vs {mesePrecLabel}
            </Text>
            {topCrescite.map((item, i) => (
              <View key={i} style={stili.rigaTopCrescita}>
                <View style={[stili.punto, { backgroundColor: item.colore }]} />
                <Text style={stili.nomeTopCrescita} numberOfLines={1}>{item.nome}</Text>
                <Text style={[stili.deltaTopCrescita, { color: t.uscita }]}>+{Math.round(item.delta)}%</Text>
                <Text style={stili.importoTopCrescita}>
                  {formatEuro(item.importo)} (era {formatEuro(item.prev)})
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Esporta CSV (solo web) ── */}
        {Platform.OS === 'web' && (
          <TouchableOpacity style={stili.btnCSV} onPress={esportaCSV}>
            <Ionicons name="download-outline" size={16} color={t.primario} />
            <Text style={stili.testoCSV}>Esporta CSV — {periodoLabel}</Text>
          </TouchableOpacity>
        )}

        {/* ── Uscite per categoria ── */}
        <SezioneTabella
          titolo="Uscite per categoria"
          righe={righeUscite}
          totale={totaleUscite}
          tipo="uscita"
          mostraBudget={vista === 'mensile'}
          importiPrecedenti={vista === 'mensile' ? mappaImportiPrecedenti : undefined}
          onPressRiga={(r) => setDettaglio({ categoriaId: r.categoriaId, categoria: r.categoria, tipo: 'uscita' })}
        />

        {/* ── Entrate per categoria ── */}
        <SezioneTabella
          titolo="Entrate per categoria"
          righe={righeEntrate}
          totale={totaleEntrate}
          tipo="entrata"
          onPressRiga={(r) => setDettaglio({ categoriaId: r.categoriaId, categoria: r.categoria, tipo: 'entrata' })}
        />

        {/* ── Per istituto ── */}
        {righeIstituti.length > 0 && (
          <View style={stili.sezione}>
            <Text style={stili.titoloSezione}>Per istituto</Text>
            <View style={stili.tabella}>
              <View style={[stili.rigaTabella, stili.rigaIntestazione]}>
                <Text style={[stili.cellaNome, stili.testoIntestazione]}>Istituto</Text>
                <Text style={[stili.cellaImporto, stili.testoIntestazione]}>Entrate</Text>
                <Text style={[stili.cellaImporto, stili.testoIntestazione]}>Uscite</Text>
                <View style={{ width: 20 }} />
              </View>
              {righeIstituti.map((r, i) => (
                <TouchableOpacity
                  key={r.istitutoId}
                  style={[stili.rigaTabella, i % 2 === 1 && stili.rigaAlternata]}
                  onPress={() => setDettaglioIstituto({ istitutoId: r.istitutoId, istituto: r.istituto })}
                  activeOpacity={0.7}
                >
                  <View style={[stili.cellaNome, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Ionicons name="business-outline" size={13} color={t.piuSottile} />
                    <Text style={{ fontSize: 13, color: t.titolo, flex: 1 }} numberOfLines={1}>
                      {r.istituto?.nome ?? '—'}
                    </Text>
                  </View>
                  <Text style={[stili.cellaImporto, { color: t.entrata }]}>{formatEuro(r.importoEntrate)}</Text>
                  <Text style={[stili.cellaImporto, { color: t.uscita }]}>{formatEuro(r.importoUscite)}</Text>
                  <View style={{ width: 20, alignItems: 'flex-end' }}>
                    <Ionicons name="chevron-forward" size={14} color={t.piuSottile} />
                  </View>
                </TouchableOpacity>
              ))}
              <View style={[stili.rigaTabella, stili.rigaTotale]}>
                <Text style={[stili.cellaNome, stili.testoTotale]}>Totale</Text>
                <Text style={[stili.cellaImporto, stili.testoTotale, { color: t.entrata }]}>
                  {formatEuro(righeIstituti.reduce((s, r) => s + r.importoEntrate, 0))}
                </Text>
                <Text style={[stili.cellaImporto, stili.testoTotale, { color: t.uscita }]}>
                  {formatEuro(righeIstituti.reduce((s, r) => s + r.importoUscite, 0))}
                </Text>
                <View style={{ width: 20 }} />
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Modal drill-down categoria ── */}
      <Modal
        visible={!!dettaglio}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDettaglio(undefined)}
      >
        <View style={stili.modalContenitore}>
          <View style={stili.modalHeader}>
            <View style={stili.modalHeaderLeft}>
              {dettaglio?.categoria && (
                <View style={[stili.puntoCat, { backgroundColor: dettaglio.categoria.colore }]} />
              )}
              <View>
                <Text style={stili.modalTitolo}>
                  {dettaglio?.categoria?.nome ?? '—'}
                </Text>
                <Text style={stili.modalSottotitolo}>
                  {dettaglio?.tipo === 'uscita' ? 'Uscite' : 'Entrate'} · {periodoLabel}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setDettaglio(undefined)}
              hitSlop={10}
              style={stili.btnChiudiModal}
            >
              <Ionicons name="close" size={20} color={t.sottile} />
            </TouchableOpacity>
          </View>

          {/* ── Editor budget (solo uscite) ── */}
          {dettaglio?.tipo === 'uscita' && (
            <View style={stili.editorBudget}>
              <Text style={stili.titoloEditorBudget}>Budget mensile</Text>
              <View style={stili.rigaInputBudget}>
                <Text style={{ fontSize: 16, color: t.sottile, fontWeight: '600' }}>€</Text>
                <TextInput
                  style={stili.inputBudget}
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  placeholder="Nessun limite"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  placeholderTextColor={t.segnaposto}
                />
                <TouchableOpacity
                  style={stili.btnSalvaBudget}
                  onPress={() => {
                    const v = parseFloat(budgetInput.replace(',', '.'));
                    aggiornaBudgetCategoria(dettaglio.categoriaId, isNaN(v) || v <= 0 ? undefined : v);
                  }}
                >
                  <Text style={stili.testoSalvaBudget}>Imposta</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {transazioniDettaglio.length === 0 ? (
            <View style={stili.vuotoContenitore}>
              <View style={stili.cerchioVuoto}>
                <Ionicons name="receipt-outline" size={26} color={t.piuSottile} />
              </View>
              <Text style={stili.testoVuoto}>Nessuna transazione in questo periodo</Text>
            </View>
          ) : (
            <FlatList
              data={transazioniDettaglio}
              keyExtractor={(tr) => tr.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => (
                <TransactionItem
                  transazione={item}
                  categoria={categorie.find((c) => c.id === item.categoriaId)}
                  istituto={istituti.find((i) => i.id === item.istitutoId)}
                  mostraAzioni={false}
                />
              )}
            />
          )}
        </View>
      </Modal>

      {/* ── Modal drill-down istituto ── */}
      <Modal
        visible={!!dettaglioIstituto}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDettaglioIstituto(undefined)}
      >
        <View style={stili.modalContenitore}>
          <View style={stili.modalHeader}>
            <View style={stili.modalHeaderLeft}>
              <View style={stili.avatarIstituto}>
                <Ionicons name="business-outline" size={18} color={t.primario} />
              </View>
              <View>
                <Text style={stili.modalTitolo}>
                  {dettaglioIstituto?.istituto?.nome ?? '—'}
                </Text>
                <Text style={stili.modalSottotitolo}>
                  Movimenti · {periodoLabel}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setDettaglioIstituto(undefined)}
              hitSlop={10}
              style={stili.btnChiudiModal}
            >
              <Ionicons name="close" size={20} color={t.sottile} />
            </TouchableOpacity>
          </View>

          {transazioniDettaglioIstituto.length > 0 && (() => {
            const eTot = transazioniDettaglioIstituto
              .filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0);
            const uTot = transazioniDettaglioIstituto
              .filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0);
            const saldoIst = eTot - uTot;
            return (
              <View style={[stili.rigaCard, { marginTop: 12 }]}>
                <View style={[stili.card, { backgroundColor: t.entrataSfondo }]}>
                  <Text style={[stili.etichettaCard, { color: t.entrata }]}>Entrate</Text>
                  <Text style={[stili.valoreCard, { color: t.entrata }]}>{formatEuro(eTot)}</Text>
                </View>
                <View style={[stili.card, { backgroundColor: t.uscitaSfondo }]}>
                  <Text style={[stili.etichettaCard, { color: t.uscita }]}>Uscite</Text>
                  <Text style={[stili.valoreCard, { color: t.uscita }]}>{formatEuro(uTot)}</Text>
                </View>
                <View style={[stili.card, { backgroundColor: saldoIst >= 0 ? t.primarioSfondo : t.arancioSfondo }]}>
                  <Text style={[stili.etichettaCard, { color: saldoIst >= 0 ? t.primario : t.arancio }]}>Saldo</Text>
                  <Text style={[stili.valoreCard, { color: saldoIst >= 0 ? t.primario : t.arancio }]}>
                    {formatEuro(saldoIst)}
                  </Text>
                </View>
              </View>
            );
          })()}

          {transazioniDettaglioIstituto.length === 0 ? (
            <View style={stili.vuotoContenitore}>
              <View style={stili.cerchioVuoto}>
                <Ionicons name="business-outline" size={26} color={t.piuSottile} />
              </View>
              <Text style={stili.testoVuoto}>Nessuna transazione in questo periodo</Text>
            </View>
          ) : (
            <FlatList
              data={transazioniDettaglioIstituto}
              keyExtractor={(tr) => tr.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => (
                <TransactionItem
                  transazione={item}
                  categoria={categorie.find((c) => c.id === item.categoriaId)}
                  istituto={istituti.find((i) => i.id === item.istitutoId)}
                  mostraAzioni={false}
                />
              )}
            />
          )}
        </View>
      </Modal>

    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Componente riutilizzabile per la tabella per categoria

interface PropsSezTabella {
  titolo: string;
  righe: RigaCategoria[];
  totale: number;
  tipo: 'entrata' | 'uscita';
  mostraBudget?: boolean;
  importiPrecedenti?: Map<string, number>;
  onPressRiga: (r: RigaCategoria) => void;
}

function SezioneTabella({ titolo, righe, totale, tipo, mostraBudget, importiPrecedenti, onPressRiga }: PropsSezTabella) {
  const t = useTema();
  const st = useMemo(() => creaStiliTabella(t), [t]);

  if (righe.length === 0) return null;
  const colore = tipo === 'uscita' ? t.uscita : t.entrata;

  return (
    <View style={st.sezione}>
      <Text style={st.titoloSezione}>{titolo}</Text>
      <View style={st.tabella}>

        <View style={[st.rigaTabella, st.rigaIntestazione]}>
          <Text style={[st.cellaNome, st.testoIntestazione]}>Categoria</Text>
          <Text style={[st.cellaImporto, st.testoIntestazione]}>Importo</Text>
          <Text style={[st.cellaPerc, st.testoIntestazione]}>%</Text>
          <View style={{ width: 20 }} />
        </View>

        {righe.map((r, i) => {
          const perc = totale > 0 ? (r.importo / totale) * 100 : 0;
          const budget = r.categoria?.budgetMensile;
          const percBudget = budget ? Math.min((r.importo / budget) * 100, 100) : 0;
          const coloreBudget = percBudget >= 100 ? t.uscita : percBudget >= 80 ? t.arancio : t.entrata;
          const sfondoRiga = i % 2 === 1 ? st.rigaAlternata : undefined;

          const prev = importiPrecedenti?.get(r.categoriaId);
          const delta = prev && prev > 0 ? ((r.importo - prev) / prev) * 100 : null;

          return (
            <View key={r.categoriaId}>
              <TouchableOpacity
                style={[st.rigaTabella, sfondoRiga]}
                onPress={() => onPressRiga(r)}
                activeOpacity={0.7}
              >
                <View style={[st.cellaNome, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <View style={[st.punto, { backgroundColor: r.categoria?.colore ?? t.piuSottile }]} />
                  <Text style={{ fontSize: 13, color: t.titolo, flex: 1 }} numberOfLines={1}>
                    {r.categoria?.nome ?? '—'}
                  </Text>
                </View>
                <View style={{ width: 88, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, color: colore, fontWeight: '600' }}>
                    {formatEuro(r.importo)}
                  </Text>
                  {delta !== null && (
                    <Text style={{
                      fontSize: 10, fontWeight: '700',
                      color: delta > 0 ? t.uscita : t.entrata,
                    }}>
                      {delta > 0 ? '↑' : '↓'} {Math.abs(Math.round(delta))}%
                    </Text>
                  )}
                </View>
                <Text style={st.cellaPerc}>{perc.toFixed(0)}%</Text>
                <View style={{ width: 20, alignItems: 'flex-end' }}>
                  <Ionicons name="chevron-forward" size={14} color={t.piuSottile} />
                </View>
              </TouchableOpacity>
              {mostraBudget && budget != null && (
                <View style={[st.rigaBudget, sfondoRiga]}>
                  <View style={st.barraBudgetSfondo}>
                    <View style={[st.barraBudgetRiempimento, {
                      width: `${percBudget}%` as `${number}%`,
                      backgroundColor: coloreBudget,
                    }]} />
                  </View>
                  <Text style={st.testoBudget}>
                    {formatEuro(r.importo)} / {formatEuro(budget)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={[st.rigaTabella, st.rigaTotale]}>
          <Text style={[st.cellaNome, st.testoTotale]}>Totale</Text>
          <Text style={[st.cellaImporto, st.testoTotale, { color: colore }]}>{formatEuro(totale)}</Text>
          <Text style={[st.cellaPerc, st.testoTotale]}>100%</Text>
          <View style={{ width: 20 }} />
        </View>

      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stili schermata principale

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },

    // ── Toggle ──
    toggleContenitore: {
      flexDirection: 'row',
      backgroundColor: t.toggleSfondo,
      borderRadius: 12,
      margin: 16,
      marginBottom: 4,
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

    // ── Navigatore ──
    navigatoreContenitore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginBottom: 12,
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
    testoPeriodo: {
      fontSize: 15,
      fontWeight: '700',
      color: t.titolo,
    },

    // ── Cards totali ──
    rigaCard: {
      flexDirection: 'row',
      marginHorizontal: 16,
      gap: 8,
      marginBottom: 8,
    },
    card: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      gap: 4,
    },
    rigaIconCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    etichettaCard: {
      fontSize: 10,
      fontWeight: '600',
    },
    valoreCard: {
      fontSize: 13,
      fontWeight: '800',
    },

    // ── Card metriche ──
    cardMetrica: {
      marginHorizontal: 16,
      marginBottom: 6,
      backgroundColor: t.carta,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    etichettaMetrica: {
      fontSize: 13,
      color: t.corpo,
      fontWeight: '500',
    },
    notaMetrica: {
      fontSize: 11,
      color: t.piuSottile,
      marginTop: 2,
    },
    valoreMetrica: {
      fontSize: 15,
      fontWeight: '700',
    },

    // ── Box top crescite ──
    boxTopCrescite: {
      marginHorizontal: 16,
      marginBottom: 6,
      backgroundColor: t.carta,
      borderRadius: 14,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: t.uscita,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    titoloTopCrescite: {
      fontSize: 11,
      fontWeight: '700',
      color: t.uscita,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    rigaTopCrescita: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    punto: {
      width: 10,
      height: 10,
      borderRadius: 5,
      flexShrink: 0,
    },
    nomeTopCrescita:    { flex: 1, fontSize: 13, color: t.corpo, fontWeight: '500' },
    deltaTopCrescita:   { fontSize: 13, fontWeight: '700' },
    importoTopCrescita: { fontSize: 11, color: t.piuSottile },

    // ── Sezione istituti (tabella con stili inline) ──
    sezione:       { marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
    titoloSezione: {
      fontSize: 13,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    tabella: {
      backgroundColor: t.carta,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 1,
    },
    rigaTabella: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 14,
    },
    rigaIntestazione: {
      backgroundColor: t.superfice,
      borderBottomWidth: 1,
      borderBottomColor: t.bordoSottile,
    },
    rigaAlternata: {
      backgroundColor: t.bordoSottile,
    },
    rigaTotale: {
      borderTopWidth: 1,
      borderTopColor: t.bordo,
      backgroundColor: t.superfice,
    },
    cellaNome:    { flex: 1 },
    cellaImporto: { width: 88, textAlign: 'right', fontSize: 13 },
    cellaPerc:    { width: 36, textAlign: 'right', fontSize: 13, color: t.piuSottile },
    testoIntestazione: {
      fontSize: 10,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    testoTotale: { fontSize: 13, fontWeight: '700', color: t.titolo },

    // ── Alert budget ──
    bannerAlert: {
      marginHorizontal: 16,
      marginBottom: 6,
      backgroundColor: t.arancioSfondo,
      borderRadius: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderLeftWidth: 3,
      borderLeftColor: t.arancio,
    },
    titoloAlert: { fontSize: 13, fontWeight: '700', color: t.arancio, marginBottom: 4 },
    voceAlert:   { fontSize: 12, fontWeight: '500', marginTop: 2 },

    // ── Esporta CSV ──
    btnCSV: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 6,
      backgroundColor: t.primarioSfondo,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    testoCSV: { fontSize: 13, fontWeight: '600', color: t.primario },

    // ── Modal ──
    modalContenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: 28,
      backgroundColor: t.carta,
      borderBottomWidth: 1,
      borderBottomColor: t.bordoSottile,
    },
    modalHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    modalTitolo:      { fontSize: 17, fontWeight: '700', color: t.titolo },
    modalSottotitolo: { fontSize: 13, color: t.piuSottile, marginTop: 2 },
    puntoCat: {
      width: 14,
      height: 14,
      borderRadius: 7,
      flexShrink: 0,
    },
    avatarIstituto: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.primarioSfondo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    btnChiudiModal: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.superfice,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ── Stato vuoto modal ──
    vuotoContenitore: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    cerchioVuoto: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.superfice,
      borderWidth: 1.5,
      borderColor: t.bordo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    testoVuoto: {
      fontSize: 15,
      color: t.piuSottile,
    },

    // ── Editor budget nel modal ──
    editorBudget: {
      margin: 16,
      marginBottom: 4,
      backgroundColor: t.superfice,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    titoloEditorBudget: {
      fontSize: 10,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    rigaInputBudget: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inputBudget: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 10,
      padding: 10,
      fontSize: 15,
      backgroundColor: t.carta,
      color: t.titolo,
    },
    btnSalvaBudget: {
      backgroundColor: t.primario,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    testoSalvaBudget: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Stili tabella categoria (usati da SezioneTabella)

function creaStiliTabella(t: Tema) {
  return StyleSheet.create({
    sezione:       { marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
    titoloSezione: {
      fontSize: 13,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    tabella: {
      backgroundColor: t.carta,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 1,
    },
    rigaTabella: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 14,
    },
    rigaIntestazione: {
      backgroundColor: t.superfice,
      borderBottomWidth: 1,
      borderBottomColor: t.bordoSottile,
    },
    rigaAlternata: {
      backgroundColor: t.bordoSottile,
    },
    rigaTotale: {
      borderTopWidth: 1,
      borderTopColor: t.bordo,
      backgroundColor: t.superfice,
    },
    cellaNome:    { flex: 1 },
    cellaImporto: { width: 88, textAlign: 'right', fontSize: 13 },
    cellaPerc:    { width: 36, textAlign: 'right', fontSize: 13, color: t.piuSottile },
    testoIntestazione: {
      fontSize: 10,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    testoTotale: { fontSize: 13, fontWeight: '700', color: t.titolo },
    punto: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    rigaBudget: {
      paddingHorizontal: 14,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    barraBudgetSfondo: {
      flex: 1,
      height: 6,
      backgroundColor: t.bordoSottile,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barraBudgetRiempimento: { height: 6, borderRadius: 3 },
    testoBudget: { fontSize: 11, color: t.piuSottile, width: 124, textAlign: 'right' },
  });
}
