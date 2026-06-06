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
  for (const t of transazioni) {
    if (t.tipo !== tipo) continue;
    totali.set(t.categoriaId, (totali.get(t.categoriaId) ?? 0) + t.importo);
    conti.set(t.categoriaId,  (conti.get(t.categoriaId)  ?? 0) + 1);
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
  for (const t of transazioni) {
    if (!t.istitutoId) continue;
    const curr = mappa.get(t.istitutoId) ?? { entrate: 0, uscite: 0 };
    if (t.tipo === 'entrata') curr.entrate += t.importo;
    else curr.uscite += t.importo;
    mappa.set(t.istitutoId, curr);
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

  const oggi = new Date();
  const [vista, setVista] = useState<VistaAnalisi>('annuale');
  const [anno,  setAnno]  = useState(oggi.getFullYear());
  const [mese,  setMese]  = useState(oggi.getMonth()); // 0-based

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
    const base = transazioni.filter((t) => !t.ricorrente);
    if (vista === 'annuale') {
      return base.filter((t) => t.data.startsWith(String(anno)));
    }
    const mm = String(mese + 1).padStart(2, '0');
    return base.filter((t) => t.data.startsWith(`${anno}-${mm}`));
  }, [transazioni, vista, anno, mese]);

  // ── Aggregazioni periodo corrente ──
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
    return transazioni.filter((t) => !t.ricorrente && t.data.startsWith(`${ap}-${mm}`));
  }, [transazioni, vista, anno, mese]);

  const righeUscitePrecedenti = useMemo(
    () => calcolaRigheCategoria(transazioniMesePrecedente, categorie, 'uscita'),
    [transazioniMesePrecedente, categorie],
  );

  // Mappa: categoriaId → importo del mese precedente
  const mappaImportiPrecedenti = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of righeUscitePrecedenti) map.set(r.categoriaId, r.importo);
    return map;
  }, [righeUscitePrecedenti]);

  // Top 3 categorie che sono cresciute di più rispetto al mese precedente
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
          colore:  r.categoria?.colore ?? '#AAA',
          importo: r.importo,
          prev,
          delta: ((r.importo - prev) / prev) * 100,
        };
      })
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3);
  }, [righeUscite, mappaImportiPrecedenti, vista]);

  // ── Navigazione periodo ──
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

  // ── Tasso di risparmio e proiezione fine anno ──
  const tassoRisparmio = totaleEntrate > 0 ? (saldo / totaleEntrate) * 100 : 0;

  const proiezioneFineAnno = useMemo(() => {
    if (vista !== 'annuale') return null;
    const oggi = new Date();
    if (anno !== oggi.getFullYear()) return null;
    const mesCorrente = oggi.getMonth();
    if (mesCorrente === 0) return null;

    const saldiMensili: number[] = [];
    for (let m = 0; m <= mesCorrente; m++) {
      const chiave = `${anno}-${String(m + 1).padStart(2, '0')}`;
      const ts = transazioni.filter((t) => t.data.startsWith(chiave));
      if (ts.length === 0) continue;
      saldiMensili.push(
        ts.reduce((acc, t) => acc + (t.tipo === 'entrata' ? t.importo : -t.importo), 0),
      );
    }
    if (saldiMensili.length < 2) return null;

    const ultimi = saldiMensili.slice(-3);
    const mediaMensile = ultimi.reduce((s, v) => s + v, 0) / ultimi.length;
    const mesiRimanenti = 11 - mesCorrente;
    if (mesiRimanenti === 0) return null;

    return saldo + mediaMensile * mesiRimanenti;
  }, [transazioni, vista, anno, saldo]);

  // Categorie che hanno raggiunto o superato l'80% del budget mensile
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

  // ── Transazioni per il drill-down categoria ──
  const transazioniDettaglio = useMemo(() => {
    if (!dettaglio) return [];
    return transazioniFiltrate
      .filter((t) => t.categoriaId === dettaglio.categoriaId && t.tipo === dettaglio.tipo)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [dettaglio, transazioniFiltrate]);

  // ── Transazioni per il drill-down istituto ──
  const transazioniDettaglioIstituto = useMemo(() => {
    if (!dettaglioIstituto) return [];
    return transazioniFiltrate
      .filter((t) => t.istitutoId === dettaglioIstituto.istitutoId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [dettaglioIstituto, transazioniFiltrate]);

  const esportaCSV = () => {
    const intestazione = 'Data,Tipo,Importo,Categoria,Nota,Istituto';
    const righe = transazioniFiltrate.map((t) => {
      const cat = categorie.find((c) => c.id === t.categoriaId)?.nome ?? '';
      const ist = istituti.find((i) => i.id === t.istitutoId)?.nome ?? '';
      const nota = (t.nota ?? '').replace(/"/g, '""');
      return `${t.data},${t.tipo},${t.importo},"${cat}","${nota}","${ist}"`;
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
        <TouchableOpacity onPress={navigaPrecedente} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={stili.testoPeriodo}>{periodoLabel}</Text>
        <TouchableOpacity onPress={navigaSuccessivo} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Card saldo / entrate / uscite ── */}
        <View style={stili.rigaCard}>
          <View style={[stili.card, { backgroundColor: '#DCFCE7' }]}>
            <Text style={stili.etichettaCard}>↑ Entrate</Text>
            <Text style={[stili.valoreCard, { color: '#16A34A' }]}>{formatEuro(totaleEntrate)}</Text>
          </View>
          <View style={[stili.card, { backgroundColor: '#FEE2E2' }]}>
            <Text style={stili.etichettaCard}>↓ Uscite</Text>
            <Text style={[stili.valoreCard, { color: '#DC2626' }]}>{formatEuro(totaleUscite)}</Text>
          </View>
          <View style={[stili.card, { backgroundColor: saldo >= 0 ? '#DBEAFE' : '#FFF7ED' }]}>
            <Text style={stili.etichettaCard}>= Saldo</Text>
            <Text style={[stili.valoreCard, { color: saldo >= 0 ? '#2563EB' : '#EA580C' }]}>
              {formatEuro(saldo)}
            </Text>
          </View>
        </View>

        {/* ── Tasso di risparmio ── */}
        <View style={stili.cardRisparmio}>
          <Text style={stili.etichettaRisparmio}>Tasso di risparmio</Text>
          <Text style={[stili.valoreRisparmio, { color: tassoRisparmio >= 0 ? '#16A34A' : '#DC2626' }]}>
            {tassoRisparmio >= 0 ? '+' : ''}{tassoRisparmio.toFixed(1)}%
          </Text>
        </View>

        {/* ── Risparmio del mese (solo mensile) ── */}
        {vista === 'mensile' && (
          <View style={stili.cardRisparmio}>
            <Text style={stili.etichettaRisparmio}>Risparmio del mese</Text>
            <Text style={[stili.valoreRisparmio, { color: saldo >= 0 ? '#16A34A' : '#DC2626' }]}>
              {saldo >= 0 ? '+' : ''}{formatEuro(saldo)}
            </Text>
          </View>
        )}

        {/* ── Risparmio medio mensile (solo annuale) ── */}
        {vista === 'annuale' && (
          <View style={stili.cardRisparmio}>
            <Text style={stili.etichettaRisparmio}>Risparmio medio mensile</Text>
            <Text style={[stili.valoreRisparmio, { color: saldo >= 0 ? '#16A34A' : '#DC2626' }]}>
              {saldo >= 0 ? '+' : ''}{formatEuro(saldo / 12)}
            </Text>
          </View>
        )}

        {/* ── Proiezione fine anno (solo annuale, anno corrente, ≥ 2 mesi di dati) ── */}
        {proiezioneFineAnno !== null && (
          <View style={stili.cardRisparmio}>
            <View>
              <Text style={stili.etichettaRisparmio}>Proiezione fine anno</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                Media ultimi 3 mesi
              </Text>
            </View>
            <Text style={[stili.valoreRisparmio, { color: proiezioneFineAnno >= 0 ? '#16A34A' : '#DC2626' }]}>
              {proiezioneFineAnno >= 0 ? '+' : ''}{formatEuro(proiezioneFineAnno)}
            </Text>
          </View>
        )}

        {/* ── Alert budget (solo vista mensile) ── */}
        {alerteBudget.length > 0 && (
          <View style={stili.bannerAlert}>
            <Ionicons name="warning" size={16} color="#F97316" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={stili.titoloAlert}>Attenzione al budget</Text>
              {alerteBudget.map((a, i) => (
                <Text key={i} style={[stili.voceAlert, { color: a.perc >= 100 ? '#DC2626' : '#EA580C' }]}>
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
              ↑ Categorie cresciute vs {mesePrecLabel}
            </Text>
            {topCrescite.map((item, i) => (
              <View key={i} style={stili.rigaTopCrescita}>
                <View style={[stili.punto, { backgroundColor: item.colore }]} />
                <Text style={stili.nomeTopCrescita} numberOfLines={1}>{item.nome}</Text>
                <Text style={stili.deltaTopCrescita}>+{Math.round(item.delta)}%</Text>
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
            <Ionicons name="download-outline" size={16} color="#2563EB" />
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

        {/* ── Per istituto (solo se ci sono transazioni con istituto) ── */}
        {righeIstituti.length > 0 && (
          <View style={stili.sezione}>
            <Text style={stili.titoloSezione}>Per istituto</Text>
            <View style={stili.tabella}>
              <View style={[stili.riga, stili.rigaIntestazione]}>
                <Text style={[stili.cellaNome, stili.testoIntestazione]}>Istituto</Text>
                <Text style={[stili.cellaImporto, stili.testoIntestazione]}>Entrate</Text>
                <Text style={[stili.cellaImporto, stili.testoIntestazione]}>Uscite</Text>
                <View style={{ width: 20 }} />
              </View>
              {righeIstituti.map((r, i) => (
                <TouchableOpacity
                  key={r.istitutoId}
                  style={[stili.riga, i % 2 === 1 && stili.rigaAlternata]}
                  onPress={() => setDettaglioIstituto({ istitutoId: r.istitutoId, istituto: r.istituto })}
                  activeOpacity={0.7}
                >
                  <View style={[stili.cellaNome, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Ionicons name="business-outline" size={13} color="#777" />
                    <Text style={{ fontSize: 13, color: '#333', flex: 1 }} numberOfLines={1}>
                      {r.istituto?.nome ?? '—'}
                    </Text>
                  </View>
                  <Text style={[stili.cellaImporto, { color: '#2E7D32' }]}>{formatEuro(r.importoEntrate)}</Text>
                  <Text style={[stili.cellaImporto, { color: '#C62828' }]}>{formatEuro(r.importoUscite)}</Text>
                  <View style={{ width: 20, alignItems: 'flex-end' }}>
                    <Ionicons name="chevron-forward" size={14} color="#CCC" />
                  </View>
                </TouchableOpacity>
              ))}
              <View style={[stili.riga, stili.rigaTotale]}>
                <Text style={[stili.cellaNome, stili.testoTotale]}>Totale</Text>
                <Text style={[stili.cellaImporto, stili.testoTotale, { color: '#2E7D32' }]}>
                  {formatEuro(righeIstituti.reduce((s, r) => s + r.importoEntrate, 0))}
                </Text>
                <Text style={[stili.cellaImporto, stili.testoTotale, { color: '#C62828' }]}>
                  {formatEuro(righeIstituti.reduce((s, r) => s + r.importoUscite, 0))}
                </Text>
                <View style={{ width: 20 }} />
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Modal drill-down ── */}
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
            <TouchableOpacity onPress={() => setDettaglio(undefined)} hitSlop={10}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* ── Editor budget (solo uscite) ── */}
          {dettaglio?.tipo === 'uscita' && (
            <View style={stili.editorBudget}>
              <Text style={stili.titoloEditorBudget}>Budget mensile</Text>
              <View style={stili.rigaInputBudget}>
                <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '600' }}>€</Text>
                <TextInput
                  style={stili.inputBudget}
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  placeholder="Nessun limite"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  placeholderTextColor="#CBD5E1"
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
              <Ionicons name="receipt-outline" size={40} color="#CCC" />
              <Text style={stili.testoVuoto}>Nessuna transazione in questo periodo</Text>
            </View>
          ) : (
            <FlatList
              data={transazioniDettaglio}
              keyExtractor={(t) => t.id}
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
              <Ionicons name="business-outline" size={22} color="#2563EB" />
              <View>
                <Text style={stili.modalTitolo}>
                  {dettaglioIstituto?.istituto?.nome ?? '—'}
                </Text>
                <Text style={stili.modalSottotitolo}>
                  Movimenti · {periodoLabel}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setDettaglioIstituto(undefined)} hitSlop={10}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {transazioniDettaglioIstituto.length > 0 && (() => {
            const eTot = transazioniDettaglioIstituto
              .filter((t) => t.tipo === 'entrata').reduce((s, t) => s + t.importo, 0);
            const uTot = transazioniDettaglioIstituto
              .filter((t) => t.tipo === 'uscita').reduce((s, t) => s + t.importo, 0);
            const saldoIst = eTot - uTot;
            return (
              <View style={[stili.rigaCard, { marginTop: 12 }]}>
                <View style={[stili.card, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={stili.etichettaCard}>↑ Entrate</Text>
                  <Text style={[stili.valoreCard, { color: '#16A34A' }]}>{formatEuro(eTot)}</Text>
                </View>
                <View style={[stili.card, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={stili.etichettaCard}>↓ Uscite</Text>
                  <Text style={[stili.valoreCard, { color: '#DC2626' }]}>{formatEuro(uTot)}</Text>
                </View>
                <View style={[stili.card, { backgroundColor: saldoIst >= 0 ? '#DBEAFE' : '#FFF7ED' }]}>
                  <Text style={stili.etichettaCard}>= Saldo</Text>
                  <Text style={[stili.valoreCard, { color: saldoIst >= 0 ? '#2563EB' : '#EA580C' }]}>
                    {formatEuro(saldoIst)}
                  </Text>
                </View>
              </View>
            );
          })()}

          {transazioniDettaglioIstituto.length === 0 ? (
            <View style={stili.vuotoContenitore}>
              <Ionicons name="business-outline" size={40} color="#CCC" />
              <Text style={stili.testoVuoto}>Nessuna transazione in questo periodo</Text>
            </View>
          ) : (
            <FlatList
              data={transazioniDettaglioIstituto}
              keyExtractor={(t) => t.id}
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
  if (righe.length === 0) return null;
  const colore = tipo === 'uscita' ? '#DC2626' : '#16A34A';

  return (
    <View style={stili.sezione}>
      <Text style={stili.titoloSezione}>{titolo}</Text>
      <View style={stili.tabella}>

        <View style={[stili.riga, stili.rigaIntestazione]}>
          <Text style={[stili.cellaNome, stili.testoIntestazione]}>Categoria</Text>
          <Text style={[stili.cellaImporto, stili.testoIntestazione]}>Importo</Text>
          <Text style={[stili.cellaPerc, stili.testoIntestazione]}>%</Text>
          <View style={{ width: 20 }} />
        </View>

        {righe.map((r, i) => {
          const perc = totale > 0 ? (r.importo / totale) * 100 : 0;
          const budget = r.categoria?.budgetMensile;
          const percBudget = budget ? Math.min((r.importo / budget) * 100, 100) : 0;
          const coloreBudget = percBudget >= 100 ? '#DC2626' : percBudget >= 80 ? '#F97316' : '#16A34A';
          const sfondoRiga = i % 2 === 1 ? stili.rigaAlternata : undefined;

          const prev = importiPrecedenti?.get(r.categoriaId);
          const delta = prev && prev > 0 ? ((r.importo - prev) / prev) * 100 : null;

          return (
            <View key={r.categoriaId}>
              <TouchableOpacity
                style={[stili.riga, sfondoRiga]}
                onPress={() => onPressRiga(r)}
                activeOpacity={0.7}
              >
                <View style={[stili.cellaNome, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <View style={[stili.punto, { backgroundColor: r.categoria?.colore ?? '#AAA' }]} />
                  <Text style={{ fontSize: 13, color: '#333', flex: 1 }} numberOfLines={1}>
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
                      color: delta > 0 ? '#DC2626' : '#16A34A',
                    }}>
                      {delta > 0 ? '↑' : '↓'} {Math.abs(Math.round(delta))}%
                    </Text>
                  )}
                </View>
                <Text style={stili.cellaPerc}>{perc.toFixed(0)}%</Text>
                <View style={{ width: 20, alignItems: 'flex-end' }}>
                  <Ionicons name="chevron-forward" size={14} color="#CCC" />
                </View>
              </TouchableOpacity>
              {mostraBudget && budget != null && (
                <View style={[stili.rigaBudget, sfondoRiga]}>
                  <View style={stili.barraBudgetSfondo}>
                    <View style={[stili.barraBudgetRiempimento, {
                      width: `${percBudget}%` as `${number}%`,
                      backgroundColor: coloreBudget,
                    }]} />
                  </View>
                  <Text style={stili.testoBudget}>
                    {formatEuro(r.importo)} / {formatEuro(budget)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={[stili.riga, stili.rigaTotale]}>
          <Text style={[stili.cellaNome, stili.testoTotale]}>Totale</Text>
          <Text style={[stili.cellaImporto, stili.testoTotale, { color: colore }]}>{formatEuro(totale)}</Text>
          <Text style={[stili.cellaPerc, stili.testoTotale]}>100%</Text>
          <View style={{ width: 20 }} />
        </View>

      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stili

const stili = StyleSheet.create({
  contenitore: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Toggle ──
  toggleContenitore: {
    flexDirection: 'row', backgroundColor: '#E0E4EA',
    borderRadius: 12, margin: 16, marginBottom: 4, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabAttivo: {
    backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  testoTab:       { fontSize: 14, fontWeight: '500', color: '#888' },
  testoTabAttivo: { color: '#1A1A2E', fontWeight: '700' },

  // ── Navigatore ──
  navigatoreContenitore: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginBottom: 12,
  },
  testoPeriodo: {
    fontSize: 16, fontWeight: '700', color: '#1A1A2E',
    minWidth: 160, textAlign: 'center',
  },

  // ── Cards totali ──
  rigaCard: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 8 },
  card: { flex: 1, borderRadius: 10, padding: 10, gap: 4 },
  etichettaCard: { fontSize: 10, color: '#666' },
  valoreCard:    { fontSize: 13, fontWeight: '700' },

  // ── Card metriche ──
  cardRisparmio: {
    marginHorizontal: 16, marginBottom: 4, backgroundColor: '#FFF',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  etichettaRisparmio: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  valoreRisparmio:    { fontSize: 15, fontWeight: '700' },

  // ── Box top crescite ──
  boxTopCrescite: {
    marginHorizontal: 16, marginBottom: 4, backgroundColor: '#FFF',
    borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#DC2626',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  titoloTopCrescite: {
    fontSize: 11, fontWeight: '700', color: '#DC2626',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  rigaTopCrescita: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  nomeTopCrescita:   { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  deltaTopCrescita:  { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  importoTopCrescita:{ fontSize: 11, color: '#94A3B8' },

  // ── Sezione + tabella ──
  sezione:       { marginHorizontal: 16, marginTop: 20 },
  titoloSezione: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 8 },
  tabella: {
    backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },

  // ── Righe ──
  riga: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  rigaIntestazione: { backgroundColor: '#F5F6FA', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  rigaAlternata:    { backgroundColor: '#FAFBFC' },
  rigaTotale:       { borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#F5F6FA' },

  // ── Celle ──
  cellaNome:    { flex: 1 },
  cellaImporto: { width: 88, textAlign: 'right', fontSize: 13 },
  cellaPerc:    { width: 36, textAlign: 'right', fontSize: 13, color: '#888' },

  // ── Testi ──
  testoIntestazione: {
    fontSize: 10, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  testoTotale: { fontSize: 13, fontWeight: '700', color: '#333' },

  // ── Pallini ──
  punto:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  puntoCat: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },

  // ── Modal ──
  modalContenitore: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 28, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  modalHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTitolo:      { fontSize: 17, fontWeight: '700', color: '#222' },
  modalSottotitolo: { fontSize: 13, color: '#888', marginTop: 2 },

  // ── Stato vuoto modal ──
  vuotoContenitore: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  testoVuoto:       { fontSize: 15, color: '#AAA' },

  // ── Editor budget nel modal ──
  editorBudget: {
    margin: 16, marginBottom: 4, backgroundColor: '#F8FAFC',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0',
  },
  titoloEditorBudget: {
    fontSize: 10, fontWeight: '700', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  rigaInputBudget: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputBudget: {
    flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 10, padding: 10, fontSize: 15,
    backgroundColor: '#FFF', color: '#0F172A',
  },
  btnSalvaBudget: {
    backgroundColor: '#2563EB', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  testoSalvaBudget: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // ── Alert budget ──
  bannerAlert: {
    marginHorizontal: 16, marginBottom: 4, backgroundColor: '#FFF7ED',
    borderRadius: 12, padding: 14, flexDirection: 'row',
    alignItems: 'flex-start', gap: 10,
    borderLeftWidth: 3, borderLeftColor: '#F97316',
  },
  titoloAlert: { fontSize: 13, fontWeight: '700', color: '#C2410C', marginBottom: 4 },
  voceAlert:   { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // ── Esporta CSV ──
  btnCSV: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 4, backgroundColor: '#EFF6FF',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  testoCSV: { fontSize: 13, fontWeight: '600', color: '#2563EB' },

  // ── Barre progresso budget ──
  rigaBudget: {
    paddingHorizontal: 14, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  barraBudgetSfondo: {
    flex: 1, height: 6, backgroundColor: '#E2E8F0',
    borderRadius: 3, overflow: 'hidden',
  },
  barraBudgetRiempimento: { height: 6, borderRadius: 3 },
  testoBudget: { fontSize: 11, color: '#94A3B8', width: 124, textAlign: 'right' },
});
