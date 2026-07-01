// ── Schermata Riepilogo: saldo, cruscotto flusso e ultime transazioni del periodo ──
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import BottomSheet from '../../components/BottomSheet';
import CountUpText from '../../components/CountUpText';
import FadeInView from '../../components/FadeInView';
import PressableScale from '../../components/PressableScale';
import TransactionForm from '../../components/TransactionForm';
import TransactionItem from '../../components/TransactionItem';
import { Tema, useTema } from '../../constants/tema';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PreferenzaTema, usePreferenze } from '../../store/usePreferenze';
import { Categoria, Transazione } from '../../types';
import { generaBackupJson } from '../../utils/backup';
import { esportaFile } from '../../utils/exportFile';
import { formatEuro, oggiIso } from '../../utils/formatters';
import { classificaAvanzo } from '../../utils/livelloRisparmio';

type Periodo = 'mensile' | 'annuale';

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

function RigaFlusso({
  etichetta, importo, reddito, colore,
}: { etichetta: string; importo: number; reddito: number; colore: string }) {
  const t = useTema();
  const perc = Math.min((importo / reddito) * 100, 100);
  return (
    <View style={{ marginBottom: 12, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colore, flexShrink: 0 }} />
        <Text style={{ flex: 1, fontSize: 13, color: t.corpo, fontWeight: '500' }} numberOfLines={1}>
          {etichetta}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colore }}>{formatEuro(importo)}</Text>
        <Text style={{ fontSize: 12, color: t.piuSottile, width: 36, textAlign: 'right' }}>
          {Math.round(perc)}%
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: t.bordoSottile, borderRadius: 3, overflow: 'hidden', marginLeft: 16 }}>
        <View style={{
          height: 6, borderRadius: 3, backgroundColor: colore, opacity: 0.8,
          width: `${perc}%` as `${number}%`,
        }} />
      </View>
    </View>
  );
}

export default function RiepilogoScreen() {
  const { transazioni, categorie, istituti, reddito, aggiornaReddito, obiettivi, aggiungiTransazione } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const { width: LARGHEZZA } = useWindowDimensions();

  const { tema: prefTema, setTema } = usePreferenze();
  const iconaTema = prefTema === 'chiaro' ? 'sunny-outline' : prefTema === 'scuro' ? 'moon-outline' : 'contrast-outline';
  const ciclaTema = () => {
    const ciclo: Record<PreferenzaTema, PreferenzaTema> = { sistema: 'chiaro', chiaro: 'scuro', scuro: 'sistema' };
    setTema(ciclo[prefTema]);
  };

  const gestisciBackup = () => {
    const json = generaBackupJson(transazioni, categorie, istituti, reddito, obiettivi);
    esportaFile(`backup_appbudget_${oggiIso()}.json`, json, 'application/json');
  };

  const [periodo, setPeriodo] = useState<Periodo>('mensile');
  const [dataCorrente, setDataCorrente] = useState(new Date());
  const [modaleReddito, setModaleReddito] = useState(false);
  const [redditoInput, setRedditoInput] = useState('');
  const [modaleNuova, setModaleNuova] = useState(false);

  const gestisciSalvaTransazione = (dati: Omit<Transazione, 'id'>) => {
    aggiungiTransazione(dati);
  };

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

  const totaleInvestimenti = useMemo(() =>
    transazioniFiltrate
      .filter((tr) => tr.tipo === 'uscita' && categorie.find((c) => c.id === tr.categoriaId)?.tipo === 'investimento')
      .reduce((s, tr) => s + tr.importo, 0),
    [transazioniFiltrate, categorie],
  );

  const totaleFisse = useMemo(() =>
    transazioniFiltrate
      .filter((tr) => tr.tipo === 'uscita' && categorie.find((c) => c.id === tr.categoriaId)?.tipo === 'fissa')
      .reduce((s, tr) => s + tr.importo, 0),
    [transazioniFiltrate, categorie],
  );

  const totaleVariabili = useMemo(() =>
    transazioniFiltrate
      .filter((tr) => tr.tipo === 'uscita' && categorie.find((c) => c.id === tr.categoriaId)?.tipo === 'variabile')
      .reduce((s, tr) => s + tr.importo, 0),
    [transazioniFiltrate, categorie],
  );

  const redditoRiferimento = periodo === 'annuale' ? reddito * 12 : reddito;
  const avanzo = redditoRiferimento - totaleInvestimenti - totaleFisse - totaleVariabili;
  const percAvanzoSuReddito = redditoRiferimento > 0 ? (avanzo / redditoRiferimento) * 100 : 0;
  const livelloRisparmio = classificaAvanzo(percAvanzoSuReddito, t);

  const ultimi6MesiSaldi = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const chiave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '00')}`;
      const ts = transazioni.filter((tr) => !tr.ricorrente && tr.data.startsWith(chiave));
      return {
        value: ts.reduce((acc, tr) => acc + (tr.tipo === 'entrata' ? tr.importo : -tr.importo), 0),
        label: MESI[d.getMonth()].substring(0, 3),
        labelTextStyle: { fontSize: 10, color: t.piuSottile },
      };
    }),
    [transazioni, t],
  );

  const transazioniOrdinate = useMemo(
    () => [...transazioniFiltrate].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [transazioniFiltrate],
  );

  // ── Statistiche avanzate ──

  // Giorni trascorsi nel periodo selezionato (usati come denominatore della media giornaliera)
  const giorniPeriodo = useMemo(() => {
    const oggi = new Date();
    if (periodo === 'mensile') {
      const giorniMese = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth() + 1, 0).getDate();
      const isMeseCorrente = dataCorrente.getFullYear() === oggi.getFullYear() && dataCorrente.getMonth() === oggi.getMonth();
      return isMeseCorrente ? oggi.getDate() : giorniMese;
    }
    const isAnnoCorrente = dataCorrente.getFullYear() === oggi.getFullYear();
    if (!isAnnoCorrente) {
      const bisestile = new Date(dataCorrente.getFullYear(), 1, 29).getMonth() === 1;
      return bisestile ? 366 : 365;
    }
    const inizioAnno = new Date(oggi.getFullYear(), 0, 1);
    return Math.floor((oggi.getTime() - inizioAnno.getTime()) / 86400000) + 1;
  }, [periodo, dataCorrente]);

  const mediaGiornaliera = giorniPeriodo > 0 ? totaleUscite / giorniPeriodo : 0;

  // Top 3 categorie di spesa del periodo
  const topCategorieSpesa = useMemo(() => {
    const mappa = new Map<string, number>();
    for (const tr of transazioniFiltrate) {
      if (tr.tipo !== 'uscita') continue;
      mappa.set(tr.categoriaId, (mappa.get(tr.categoriaId) ?? 0) + tr.importo);
    }
    return Array.from(mappa.entries())
      .map(([categoriaId, valore]) => ({ categoria: categorie.find((c) => c.id === categoriaId), valore }))
      .filter((d): d is { categoria: Categoria; valore: number } => d.categoria != null)
      .sort((a, b) => b.valore - a.valore)
      .slice(0, 3);
  }, [transazioniFiltrate, categorie]);

  // Confronto con la spesa media dei 3 mesi precedenti (solo vista mensile)
  const mediaUsciteTreMesiPrec = useMemo(() => {
    if (periodo !== 'mensile') return null;
    let somma = 0;
    for (let i = 1; i <= 3; i++) {
      const d = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth() - i, 1);
      const chiave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      somma += transazioni
        .filter((tr) => !tr.ricorrente && tr.tipo === 'uscita' && tr.data.startsWith(chiave))
        .reduce((s, tr) => s + tr.importo, 0);
    }
    return somma / 3;
  }, [periodo, dataCorrente, transazioni]);

  const differenzaMediaPerc = mediaUsciteTreMesiPrec != null && mediaUsciteTreMesiPrec > 0
    ? ((totaleUscite - mediaUsciteTreMesiPrec) / mediaUsciteTreMesiPrec) * 100
    : null;

  const coloriGradiente: [string, string] = saldo >= 0
    ? t.gradientePositivo
    : t.gradienteNegativo;

  // Confronto con il saldo del mese precedente: una differenza in euro è più leggibile di una
  // percentuale quando il saldo può cambiare segno da un mese all'altro (rende una % fuorviante)
  const saldoMesePrecedente = useMemo(() => {
    if (periodo !== 'mensile') return null;
    const d = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth() - 1, 1);
    const chiave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return transazioni
      .filter((tr) => !tr.ricorrente && tr.data.startsWith(chiave))
      .reduce((acc, tr) => acc + (tr.tipo === 'entrata' ? tr.importo : -tr.importo), 0);
  }, [periodo, dataCorrente, transazioni]);

  const variazioneSaldo = saldoMesePrecedente != null ? saldo - saldoMesePrecedente : null;
  const nomeMesePrecedenteBreve = MESI[(dataCorrente.getMonth() + 11) % 12].substring(0, 3).toLowerCase();

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
          <View style={stili.rigaToggle}>
            <View style={[stili.toggle, { flex: 1 }]}>
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
            <PressableScale onPress={gestisciBackup} style={stili.btnTema} hitSlop={8} {...suggerimento('Esporta backup JSON')}>
              <Ionicons name="cloud-download-outline" size={20} color={t.sottile} />
            </PressableScale>
            <PressableScale onPress={ciclaTema} style={stili.btnTema} hitSlop={8} {...suggerimento('Cambia tema')}>
              <Ionicons name={iconaTema} size={20} color={t.sottile} />
            </PressableScale>
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
        </View>

        {/* ── Card saldo con gradiente ── */}
        <FadeInView ritardo={0}>
          <LinearGradient
            colors={coloriGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={stili.cardSaldo}
          >
            {/* Cerchi decorativi in vetro per dare profondità senza librerie native extra */}
            <View style={stili.cerchioDecorativoGrande} />
            <View style={stili.cerchioDecorativoPiccolo} />

            <Text style={stili.etichettaSaldo}>
              {periodo === 'mensile' ? 'Saldo del mese' : "Saldo dell'anno"}
            </Text>
            <CountUpText
              valore={saldo}
              formatta={(n) => `${n >= 0 ? '+' : ''}${formatEuro(n)}`}
              style={stili.valoreSaldo}
            />
            {variazioneSaldo != null && variazioneSaldo !== 0 && (
              <View style={stili.badgeVariazione}>
                <Ionicons
                  name={variazioneSaldo >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={11}
                  color="#FFFFFF"
                />
                <Text style={stili.testoVariazione}>
                  {variazioneSaldo >= 0 ? '+' : ''}{formatEuro(variazioneSaldo)} vs {nomeMesePrecedenteBreve}
                </Text>
              </View>
            )}
            <View style={stili.rigaStat}>
              <View style={stili.stat}>
                <View style={stili.rigaStatIcon}>
                  <Ionicons name="arrow-up-circle-outline" size={14} color="#A7F3D0" />
                  <Text style={[stili.labelStat, { color: '#A7F3D0' }]}>Entrate</Text>
                </View>
                <CountUpText valore={totaleEntrate} formatta={formatEuro} style={[stili.valoreStat, { color: '#A7F3D0' }]} />
              </View>
              <View style={stili.separatoreStat} />
              <View style={stili.stat}>
                <View style={stili.rigaStatIcon}>
                  <Ionicons name="arrow-down-circle-outline" size={14} color="#FECDD3" />
                  <Text style={[stili.labelStat, { color: '#FECDD3' }]}>Uscite</Text>
                </View>
                <CountUpText valore={totaleUscite} formatta={formatEuro} style={[stili.valoreStat, { color: '#FECDD3' }]} />
              </View>
            </View>
          </LinearGradient>
        </FadeInView>

        {/* ── Cruscotto flusso ── */}
        <FadeInView ritardo={80} style={stili.cruscotto}>
          <View style={stili.intestazioneCruscotto}>
            <Text style={stili.titoloCruscotto}>
              {periodo === 'mensile' ? 'Flusso mensile' : 'Flusso annuale'}
            </Text>
            <PressableScale style={stili.btnEditReddito} onPress={apriModaleReddito}>
              <Ionicons name="pencil-outline" size={12} color={t.sottile} />
              <Text style={stili.testoEditReddito}>
                {reddito > 0 ? formatEuro(redditoRiferimento) : 'Imposta reddito'}
              </Text>
            </PressableScale>
          </View>

          {reddito > 0 ? (
            <>
              {totaleInvestimenti > 0 && (
                <RigaFlusso etichetta="Investimenti" importo={totaleInvestimenti} reddito={redditoRiferimento} colore={t.viola} />
              )}
              {totaleFisse > 0 && (
                <RigaFlusso etichetta="Spese fisse" importo={totaleFisse} reddito={redditoRiferimento} colore={t.primario} />
              )}
              {totaleVariabili > 0 && (
                <RigaFlusso etichetta="Spese variabili" importo={totaleVariabili} reddito={redditoRiferimento} colore={t.arancio} />
              )}
              <View style={stili.separatoreCruscotto} />
              <View style={stili.rigaAvanzo}>
                <View style={[stili.cerchio, { backgroundColor: livelloRisparmio.coloreSfondo }]}>
                  <Ionicons name={livelloRisparmio.icona} size={14} color={livelloRisparmio.colore} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={stili.etichettaAvanzo}>
                    {periodo === 'mensile' ? 'Avanzo' : 'Avanzo annuale'}
                  </Text>
                  <View style={[stili.badgeLivello, { backgroundColor: livelloRisparmio.coloreSfondo }]}>
                    <Text style={[stili.testoBadgeLivello, { color: livelloRisparmio.colore }]}>
                      {livelloRisparmio.etichetta}
                    </Text>
                  </View>
                </View>
                <View style={stili.colonnaValoreAvanzo}>
                  <CountUpText
                    valore={avanzo}
                    formatta={(n) => `${n >= 0 ? '+' : ''}${formatEuro(n)}`}
                    style={[stili.valoreAvanzo, { color: avanzo >= 0 ? t.entrata : t.uscita }]}
                  />
                  <Text style={[stili.percAvanzo, { color: avanzo >= 0 ? t.entrata : t.uscita }]}>
                    {redditoRiferimento > 0 ? `${Math.round(Math.abs(avanzo / redditoRiferimento) * 100)}%` : ''}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <TouchableOpacity style={stili.promptReddito} onPress={apriModaleReddito}>
              <View style={stili.cerchioPrompt}>
                <Ionicons name="wallet-outline" size={18} color={t.primario} />
              </View>
              <Text style={stili.testoPromptReddito}>
                Imposta il reddito mensile per vedere come distribuisci ogni euro
              </Text>
              <Ionicons name="chevron-forward" size={16} color={t.primario} />
            </TouchableOpacity>
          )}
        </FadeInView>

        {/* ── Sparkline saldo ultimi 6 mesi ── */}
        {ultimi6MesiSaldi.some((d) => d.value !== 0) && (
          <FadeInView ritardo={160} style={stili.sezioneSparkline}>
            <Text style={stili.titoloSparkline}>Trend saldo — ultimi 6 mesi</Text>
            <LineChart
              data={ultimi6MesiSaldi}
              width={LARGHEZZA - 104}
              yAxisWidth={35}
              height={90}
              areaChart
              color={t.primario}
              thickness={2}
              startFillColor={t.primario}
              endFillColor={t.primario}
              startOpacity={0.15}
              endOpacity={0.01}
              dataPointsColor={t.primario}
              dataPointsRadius={3}
              hideDataPoints={Platform.OS === 'web'}
              noOfSections={3}
              yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
              rulesColor={t.bordoSottile}
              rulesType="solid"
              disableScroll
            />
          </FadeInView>
        )}

        {/* ── Statistiche avanzate ── */}
        {totaleUscite > 0 && (
          <FadeInView ritardo={240} style={stili.sezioneStatistiche}>
            <Text style={stili.titoloSparkline}>Statistiche</Text>

            <View style={stili.rigaStatistica}>
              <Text style={stili.etichettaStatistica}>Media spesa giornaliera</Text>
              <CountUpText valore={mediaGiornaliera} formatta={formatEuro} style={stili.valoreStatistica} />
            </View>

            {differenzaMediaPerc != null && (
              <View style={stili.rigaStatistica}>
                <Text style={stili.etichettaStatistica}>Rispetto alla media ultimi 3 mesi</Text>
                <Text style={[
                  stili.valoreStatistica,
                  { color: differenzaMediaPerc <= 0 ? t.entrata : t.uscita },
                ]}>
                  {differenzaMediaPerc >= 0 ? '+' : ''}{Math.round(differenzaMediaPerc)}%
                </Text>
              </View>
            )}

            {topCategorieSpesa.length > 0 && (
              <>
                <View style={stili.separatoreCruscotto} />
                <Text style={stili.sottotitoloStatistiche}>Categorie con più spese</Text>
                {topCategorieSpesa.map(({ categoria, valore }) => (
                  <View key={categoria.id} style={stili.rigaStatistica}>
                    <View style={stili.etichettaConPuntino}>
                      <View style={[stili.puntinoStat, { backgroundColor: categoria.colore }]} />
                      <Text style={stili.etichettaStatistica} numberOfLines={1}>{categoria.nome}</Text>
                    </View>
                    <Text style={stili.valoreStatistica}>
                      {formatEuro(valore)} · {Math.round((valore / totaleUscite) * 100)}%
                    </Text>
                  </View>
                ))}
              </>
            )}
          </FadeInView>
        )}

        {/* ── Lista transazioni del periodo ── */}
        {transazioniOrdinate.length > 0 ? (
          <>
            <Text style={stili.sottotitolo}>
              Transazioni ({transazioniOrdinate.length})
            </Text>
            {transazioniOrdinate.map((tr) => (
              <TransactionItem
                key={tr.id}
                transazione={tr}
                categoria={categorie.find((c) => c.id === tr.categoriaId)}
                istituto={istituti.find((i) => i.id === tr.istitutoId)}
                mostraAzioni={false}
              />
            ))}
          </>
        ) : (
          <Text style={stili.vuoto}>Nessuna transazione in questo periodo.</Text>
        )}

      </ScrollView>

      {/* ── Modal: imposta reddito mensile netto ── */}
      <BottomSheet visibile={modaleReddito} onChiudi={() => setModaleReddito(false)}>
        <View style={stili.corpoModal}>
          <Text style={stili.titoloModal}>Reddito mensile netto</Text>
          <Text style={stili.sottotitoloModal}>
            Inserisci il tuo stipendio netto. Viene usato per calcolare l&apos;avanzo nel cruscotto flusso.
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
              placeholderTextColor={t.segnaposto}
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
          <View style={{ height: 24 }} />
        </View>
      </BottomSheet>

      {/* ── Pulsante flottante: nuova transazione ── */}
      <PressableScale
        style={stili.fab}
        onPress={() => setModaleNuova(true)}
        {...suggerimento('Inserisci Entrata/Uscita')}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </PressableScale>

      <TransactionForm
        visibile={modaleNuova}
        onChiudi={() => setModaleNuova(false)}
        onSalva={gestisciSalvaTransazione}
        categorie={categorie}
        istituti={istituti}
      />
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
    rigaToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    btnTema: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.carta,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
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

    // ── Card saldo ──
    cardSaldo: {
      margin: 16,
      marginTop: 12,
      borderRadius: 28,
      padding: 24,
      gap: 4,
      overflow: 'hidden',
      shadowColor: t.primario,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 6,
    },
    cerchioDecorativoGrande: {
      position: 'absolute',
      top: -60,
      right: -50,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(255,255,255,0.10)',
    },
    cerchioDecorativoPiccolo: {
      position: 'absolute',
      bottom: -30,
      left: -20,
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    etichettaSaldo: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    valoreSaldo: {
      color: '#FFF',
      fontSize: 46,
      fontWeight: '800',
      letterSpacing: -1.5,
      marginTop: 4,
    },
    badgeVariazione: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    testoVariazione: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    rigaStat: {
      flexDirection: 'row',
      marginTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.2)',
      paddingTop: 14,
      gap: 12,
    },
    stat: {
      flex: 1,
      gap: 5,
    },
    rigaStatIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    separatoreStat: {
      width: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    labelStat: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
      fontWeight: '500',
    },
    valoreStat: {
      color: '#FFF',
      fontSize: 17,
      fontWeight: '700',
    },

    // ── Cruscotto flusso ──
    cruscotto: {
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      padding: 18,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    intestazioneCruscotto: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    titoloCruscotto: {
      fontSize: 14,
      fontWeight: '700',
      color: t.titolo,
    },
    btnEditReddito: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: t.superfice,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    testoEditReddito: {
      fontSize: 12,
      color: t.sottile,
      fontWeight: '600',
    },
    separatoreCruscotto: {
      height: 1,
      backgroundColor: t.bordoSottile,
      marginVertical: 10,
    },
    cerchio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rigaAvanzo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    etichettaAvanzo: {
      fontSize: 13,
      color: t.titolo,
      fontWeight: '600',
    },
    badgeLivello: {
      alignSelf: 'flex-start',
      marginTop: 3,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    testoBadgeLivello: {
      fontSize: 11,
      fontWeight: '700',
    },
    colonnaValoreAvanzo: {
      alignItems: 'flex-end',
    },
    valoreAvanzo: {
      fontSize: 14,
      fontWeight: '800',
    },
    percAvanzo: {
      fontSize: 12,
      textAlign: 'right',
      fontWeight: '600',
      marginTop: 2,
    },
    promptReddito: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 4,
    },
    cerchioPrompt: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.primarioSfondo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    testoPromptReddito: {
      flex: 1,
      fontSize: 13,
      color: t.primario,
      fontWeight: '500',
      lineHeight: 18,
    },

    // ── Sparkline ──
    sezioneSparkline: {
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      padding: 18,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    titoloSparkline: {
      fontSize: 13,
      fontWeight: '700',
      color: t.corpo,
      marginBottom: 8,
    },

    // ── Statistiche avanzate ──
    sezioneStatistiche: {
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      padding: 18,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    rigaStatistica: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingVertical: 6,
    },
    etichettaStatistica: {
      flex: 1,
      fontSize: 13,
      color: t.corpo,
    },
    valoreStatistica: {
      fontSize: 13,
      fontWeight: '700',
      color: t.titolo,
    },
    sottotitoloStatistiche: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    etichettaConPuntino: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    puntinoStat: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
    },

    // ── Lista transazioni ──
    sottotitolo: {
      fontSize: 14,
      fontWeight: '700',
      color: t.sottile,
      marginTop: 4,
      marginBottom: 4,
      marginHorizontal: 20,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    vuoto: {
      textAlign: 'center',
      color: t.piuSottile,
      margin: 40,
      lineHeight: 24,
      fontSize: 15,
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

    // ── Modal reddito ──
    corpoModal: {
      paddingHorizontal: 24,
      paddingTop: 4,
      gap: 10,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
    },
    sottotitoloModal: {
      fontSize: 13,
      color: t.sottile,
      lineHeight: 20,
    },
    rigaInputReddito: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      marginTop: 4,
      backgroundColor: t.sfondoInput,
    },
    euroSign: {
      fontSize: 20,
      fontWeight: '700',
      color: t.sottile,
    },
    inputReddito: {
      flex: 1,
      fontSize: 24,
      fontWeight: '700',
      color: t.titolo,
    },
    rigaBottoniModal: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    btnAnnullaModal: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.bordo,
      alignItems: 'center',
    },
    testoAnnullaModal: {
      color: t.sottile,
      fontSize: 15,
      fontWeight: '600',
    },
    btnSalvaModal: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: t.primario,
      alignItems: 'center',
    },
    testoSalvaModal: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
