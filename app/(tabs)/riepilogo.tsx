// ── Schermata Riepilogo: saldo, cruscotto flusso e ultime transazioni del periodo ──
import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Platform, Modal, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatEuro } from '../../utils/formatters';
import TransactionItem from '../../components/TransactionItem';

type Periodo = 'mensile' | 'annuale';

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const LARGHEZZA = Dimensions.get('window').width;

// ── Sub-componente: singola riga del cruscotto flusso ──
// Usa stili inline perché è definito prima della StyleSheet
function RigaFlusso({
  etichetta, importo, reddito, colore,
}: { etichetta: string; importo: number; reddito: number; colore: string }) {
  const perc = Math.min((importo / reddito) * 100, 100);
  return (
    <View style={{ marginBottom: 10, gap: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colore, flexShrink: 0 }} />
        <Text style={{ flex: 1, fontSize: 13, color: '#475569', fontWeight: '500' }} numberOfLines={1}>
          {etichetta}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colore }}>{formatEuro(importo)}</Text>
        <Text style={{ fontSize: 12, color: '#94A3B8', width: 36, textAlign: 'right' }}>
          {Math.round(perc)}%
        </Text>
      </View>
      <View style={{ height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginLeft: 16 }}>
        <View style={{
          height: 5, borderRadius: 3, backgroundColor: colore, opacity: 0.7,
          width: `${perc}%` as `${number}%`,
        }} />
      </View>
    </View>
  );
}

export default function RiepilogoScreen() {
  const { transazioni, categorie, istituti, reddito, aggiornaReddito } = useFinanceStore();

  const [periodo, setPeriodo] = useState<Periodo>('mensile');
  const [dataCorrente, setDataCorrente] = useState(new Date());
  const [modaleReddito, setModaleReddito] = useState(false);
  const [redditoInput, setRedditoInput] = useState('');

  const naviga = (direzione: 1 | -1) => {
    setDataCorrente((prev) => {
      const d = new Date(prev);
      if (periodo === 'mensile') d.setMonth(d.getMonth() + direzione);
      else d.setFullYear(d.getFullYear() + direzione);
      return d;
    });
  };

  const periodoLabel = periodo === 'mensile'
    ? `${MESI[dataCorrente.getMonth()]} ${dataCorrente.getFullYear()}`
    : `${dataCorrente.getFullYear()}`;

  const transazioniFiltrate = useMemo(() => {
    return transazioni.filter((t) => !t.ricorrente).filter((t) => {
      const d = new Date(t.data + 'T00:00:00');
      if (periodo === 'mensile') {
        return (
          d.getFullYear() === dataCorrente.getFullYear() &&
          d.getMonth() === dataCorrente.getMonth()
        );
      }
      return d.getFullYear() === dataCorrente.getFullYear();
    });
  }, [transazioni, periodo, dataCorrente]);

  const totaleEntrate = useMemo(
    () => transazioniFiltrate.filter((t) => t.tipo === 'entrata').reduce((a, t) => a + t.importo, 0),
    [transazioniFiltrate],
  );

  const totaleUscite = useMemo(
    () => transazioniFiltrate.filter((t) => t.tipo === 'uscita').reduce((a, t) => a + t.importo, 0),
    [transazioniFiltrate],
  );

  const saldo = totaleEntrate - totaleUscite;

  // Cruscotto: uscite suddivise per tipo categoria (solo vista mensile)
  const totaleInvestimenti = useMemo(() =>
    transazioniFiltrate
      .filter((t) => t.tipo === 'uscita' && categorie.find((c) => c.id === t.categoriaId)?.tipo === 'investimento')
      .reduce((s, t) => s + t.importo, 0),
    [transazioniFiltrate, categorie],
  );

  const totaleFisse = useMemo(() =>
    transazioniFiltrate
      .filter((t) => t.tipo === 'uscita' && categorie.find((c) => c.id === t.categoriaId)?.tipo === 'fissa')
      .reduce((s, t) => s + t.importo, 0),
    [transazioniFiltrate, categorie],
  );

  const totaleVariabili = useMemo(() =>
    transazioniFiltrate
      .filter((t) => t.tipo === 'uscita' && categorie.find((c) => c.id === t.categoriaId)?.tipo === 'variabile')
      .reduce((s, t) => s + t.importo, 0),
    [transazioniFiltrate, categorie],
  );

  const redditoRiferimento = periodo === 'annuale' ? reddito * 12 : reddito;
  const avanzo = redditoRiferimento - totaleInvestimenti - totaleFisse - totaleVariabili;

  // Sparkline: saldo netto degli ultimi 6 mesi, indipendente dal filtro periodo
  const ultimi6MesiSaldi = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const chiave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '00')}`;
      const ts = transazioni.filter((t) => !t.ricorrente && t.data.startsWith(chiave));
      return {
        value: ts.reduce((acc, t) => acc + (t.tipo === 'entrata' ? t.importo : -t.importo), 0),
        label: MESI[d.getMonth()].substring(0, 3),
        labelTextStyle: { fontSize: 10, color: '#94A3B8' },
      };
    }),
    [transazioni],
  );

  const transazioniOrdinate = useMemo(
    () => [...transazioniFiltrate].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [transazioniFiltrate],
  );

  const coloriGradiente: [string, string] = saldo >= 0
    ? ['#16A34A', '#15803D']
    : ['#DC2626', '#B91C1C'];

  const apriModaleReddito = () => {
    setRedditoInput(reddito > 0 ? String(reddito) : '');
    setModaleReddito(true);
  };

  const salvaReddito = () => {
    const v = parseFloat(redditoInput.replace(',', '.'));
    if (!isNaN(v) && v > 0) aggiornaReddito(v);
    setModaleReddito(false);
  };

  return (
    <View style={stili.contenitore}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

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
        </View>

        {/* ── Card saldo con gradiente verde/rosso ── */}
        <LinearGradient
          colors={coloriGradiente}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={stili.cardSaldo}
        >
          <Text style={stili.etichettaSaldo}>
            {periodo === 'mensile' ? 'Saldo del mese' : "Saldo dell'anno"}
          </Text>
          <Text style={stili.valoreSaldo}>
            {saldo >= 0 ? '+' : ''}{formatEuro(saldo)}
          </Text>
          <View style={stili.rigaStat}>
            <View style={stili.stat}>
              <Text style={stili.labelStat}>↑ Entrate</Text>
              <Text style={stili.valoreStat}>{formatEuro(totaleEntrate)}</Text>
            </View>
            <View style={stili.separatoreStat} />
            <View style={[stili.stat, { backgroundColor: 'rgba(160,0,0,0.50)', borderRadius: 10, padding: 8 }]}>
              <Text style={stili.labelStat}>↓ Uscite</Text>
              <Text style={stili.valoreStat}>{formatEuro(totaleUscite)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Cruscotto flusso mensile / annuale ── */}
        <View style={stili.cruscotto}>
          <View style={stili.intestazioneCruscotto}>
            <Text style={stili.titoloCruscotto}>
              {periodo === 'mensile' ? 'Flusso mensile' : 'Flusso annuale'}
            </Text>
            <TouchableOpacity style={stili.btnEditReddito} onPress={apriModaleReddito}>
              <Ionicons name="pencil-outline" size={13} color="#64748B" />
              <Text style={stili.testoEditReddito}>
                {reddito > 0 ? formatEuro(redditoRiferimento) : 'Imposta reddito'}
              </Text>
            </TouchableOpacity>
          </View>

          {reddito > 0 ? (
            <>
              {totaleInvestimenti > 0 && (
                <RigaFlusso
                  etichetta="Investimenti"
                  importo={totaleInvestimenti}
                  reddito={redditoRiferimento}
                  colore="#7C3AED"
                />
              )}
              {totaleFisse > 0 && (
                <RigaFlusso
                  etichetta="Spese fisse"
                  importo={totaleFisse}
                  reddito={redditoRiferimento}
                  colore="#2563EB"
                />
              )}
              {totaleVariabili > 0 && (
                <RigaFlusso
                  etichetta="Spese variabili"
                  importo={totaleVariabili}
                  reddito={redditoRiferimento}
                  colore="#F97316"
                />
              )}
              <View style={stili.separatoreCruscotto} />
              <View style={stili.rigaAvanzo}>
                <Ionicons
                  name={avanzo >= 0 ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={avanzo >= 0 ? '#16A34A' : '#DC2626'}
                />
                <Text style={stili.etichettaAvanzo}>
                  {periodo === 'mensile' ? 'Avanzo' : 'Avanzo annuale'}
                </Text>
                <Text style={[stili.valoreAvanzo, { color: avanzo >= 0 ? '#16A34A' : '#DC2626' }]}>
                  {avanzo >= 0 ? '+' : ''}{formatEuro(avanzo)}
                </Text>
                <Text style={[stili.percAvanzo, { color: avanzo >= 0 ? '#16A34A' : '#DC2626' }]}>
                  {redditoRiferimento > 0 ? `${Math.round(Math.abs(avanzo / redditoRiferimento) * 100)}%` : ''}
                </Text>
              </View>
            </>
          ) : (
            <TouchableOpacity style={stili.promptReddito} onPress={apriModaleReddito}>
              <Ionicons name="wallet-outline" size={20} color="#2563EB" />
              <Text style={stili.testoPromptReddito}>
                Imposta il reddito mensile per vedere come distribuisci ogni euro
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Sparkline saldo ultimi 6 mesi ── */}
        {ultimi6MesiSaldi.some((d) => d.value !== 0) && (
          <View style={stili.sezioneSparkline}>
            <Text style={stili.titoloSparkline}>Trend saldo — ultimi 6 mesi</Text>
            <LineChart
              data={ultimi6MesiSaldi}
              width={LARGHEZZA - 96}
              height={90}
              areaChart
              color="#2563EB"
              thickness={2}
              startFillColor="#2563EB"
              endFillColor="#2563EB"
              startOpacity={0.15}
              endOpacity={0.01}
              dataPointsColor="#2563EB"
              dataPointsRadius={3}
              hideDataPoints={Platform.OS === 'web'}
              noOfSections={3}
              yAxisTextStyle={{ fontSize: 10, color: '#94A3B8' }}
              rulesColor="#F1F5F9"
              rulesType="solid"
              disableScroll
            />
          </View>
        )}

        {/* ── Transazioni del periodo ── */}
        {transazioniOrdinate.length > 0 ? (
          <>
            <Text style={stili.sottotitolo}>
              Transazioni del periodo ({transazioniOrdinate.length})
            </Text>
            {transazioniOrdinate.map((t) => (
              <TransactionItem
                key={t.id}
                transazione={t}
                categoria={categorie.find((c) => c.id === t.categoriaId)}
                istituto={istituti.find((i) => i.id === t.istitutoId)}
                mostraAzioni={false}
              />
            ))}
          </>
        ) : (
          <Text style={stili.vuoto}>
            Nessuna transazione in questo periodo.
          </Text>
        )}

      </ScrollView>

      {/* ── Modal: imposta reddito mensile netto ── */}
      <Modal visible={modaleReddito} animationType="fade" transparent>
        <View style={stili.sfondoModal}>
          <View style={stili.cardModal}>
            <Text style={stili.titoloModal}>Reddito mensile netto</Text>
            <Text style={stili.sottotitoloModal}>
              Inserisci il tuo stipendio netto (al netto di tasse e contributi).
              Viene usato per calcolare l'avanzo nel cruscotto flusso.
            </Text>
            <View style={stili.rigaInputReddito}>
              <Text style={stili.euroSign}>€</Text>
              <TextInput
                style={stili.inputReddito}
                value={redditoInput}
                onChangeText={setRedditoInput}
                placeholder="0"
                keyboardType="decimal-pad"
                returnKeyType="done"
                placeholderTextColor="#CBD5E1"
                autoFocus
              />
            </View>
            <View style={stili.rigaBottoniModal}>
              <TouchableOpacity style={stili.btnAnnullaModal} onPress={() => setModaleReddito(false)}>
                <Text style={stili.testoAnnullaModal}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stili.btnSalvaModal} onPress={salvaReddito}>
                <Text style={stili.testoSalvaModal}>Salva</Text>
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

  // ── Card saldo ──
  cardSaldo: {
    margin: 16,
    marginTop: 12,
    borderRadius: 24,
    padding: 28,
    gap: 6,
  },
  etichettaSaldo: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  valoreSaldo: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  rigaStat: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  separatoreStat: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  labelStat: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
  },
  valoreStat: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // ── Cruscotto flusso mensile ──
  cruscotto: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  intestazioneCruscotto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titoloCruscotto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnEditReddito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  testoEditReddito: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  separatoreCruscotto: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  rigaAvanzo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etichettaAvanzo: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  valoreAvanzo: {
    fontSize: 14,
    fontWeight: '800',
  },
  percAvanzo: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
    fontWeight: '600',
  },
  promptReddito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  testoPromptReddito: {
    flex: 1,
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Sparkline saldo storico ──
  sezioneSparkline: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  titoloSparkline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },

  // ── Lista transazioni ──
  sottotitolo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  vuoto: {
    textAlign: 'center',
    color: '#94A3B8',
    margin: 40,
    lineHeight: 24,
    fontSize: 15,
  },

  // ── Modal reddito ──
  sfondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  cardModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  titoloModal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sottotitoloModal: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  rigaInputReddito: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginTop: 4,
    backgroundColor: '#F8FAFC',
  },
  euroSign: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  inputReddito: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  rigaBottoniModal: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btnAnnullaModal: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  testoAnnullaModal: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSalvaModal: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  testoSalvaModal: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
