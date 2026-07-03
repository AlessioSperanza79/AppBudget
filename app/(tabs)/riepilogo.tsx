// ── Schermata Riepilogo: saldo, cruscotto flusso e ultime transazioni del periodo ──
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import PressableScale from '../../components/PressableScale';
import TransactionForm from '../../components/TransactionForm';
import ContenitoreScheda from '../../components/ContenitoreScheda';
import ControlliPeriodo from '../../components/riepilogo/ControlliPeriodo';
import CardSaldo from '../../components/riepilogo/CardSaldo';
import DisponibileOggiCard from '../../components/riepilogo/DisponibileOggiCard';
import CruscottoFlusso from '../../components/riepilogo/CruscottoFlusso';
import ProssimiPagamenti from '../../components/riepilogo/ProssimiPagamenti';
import TrendSaldoSparkline from '../../components/riepilogo/TrendSaldoSparkline';
import StatisticheAvanzate from '../../components/riepilogo/StatisticheAvanzate';
import ConfrontoMesePrecedente from '../../components/riepilogo/ConfrontoMesePrecedente';
import ListaCategorieGruppo from '../../components/riepilogo/ListaCategorieGruppo';
import ModaleDettaglioCategoria from '../../components/riepilogo/ModaleDettaglioCategoria';
import ModaleReddito from '../../components/riepilogo/ModaleReddito';
import { Tema, useTema } from '../../constants/tema';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PreferenzaTema, usePreferenze } from '../../store/usePreferenze';
import { Categoria, Transazione } from '../../types';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { generaBackupJson } from '../../utils/backup';
import { esportaFile } from '../../utils/exportFile';
import { oggiIso } from '../../utils/formatters';
import { classificaAvanzo } from '../../utils/livelloRisparmio';
import { calcolaRigheBudget } from '../../utils/budget';

type Periodo = 'mensile' | 'annuale';

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

export default function RiepilogoScreen() {
  const { transazioni, categorie, istituti, reddito, aggiornaReddito, obiettivi, aggiungiTransazione, aggiungiModelloRicorrente, aggiungiTrasferimento, importaTransazioni, caricaFotoScontrino } = useFinanceStore();
  const { refreshing, onRefresh } = usePullToRefresh();

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
    if (dati.ricorrente) {
      // Un modello ricorrente creato da qui deve generare subito le transazioni mensili
      // fino a dataFine, non solo comparire come riga invisibile ai conteggi
      aggiungiModelloRicorrente(dati);
    } else {
      aggiungiTransazione(dati);
    }
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
    () => transazioniFiltrate.filter((t) => t.tipo === 'entrata' && !t.trasferimento).reduce((a, t) => a + t.importo, 0),
    [transazioniFiltrate],
  );

  const totaleUscite = useMemo(
    () => transazioniFiltrate.filter((t) => t.tipo === 'uscita' && !t.trasferimento).reduce((a, t) => a + t.importo, 0),
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

  // Transazioni del periodo raggruppate per categoria: totale netto (entrate positive, uscite
  // negative) e conteggio, ordinate per rilevanza (importo assoluto) — il dettaglio delle singole
  // transazioni si vede solo aprendo il popup della categoria, non più elencate una per una
  const [categoriaDettaglio, setCategoriaDettaglio] = useState<Categoria | undefined>();

  const gruppiPerCategoria = useMemo(() => {
    const mappa = new Map<string, { categoria: Categoria; totale: number; transazioni: Transazione[] }>();
    for (const tr of transazioniOrdinate) {
      const categoria = categorie.find((c) => c.id === tr.categoriaId);
      if (!categoria) continue;
      const voce = mappa.get(categoria.id) ?? { categoria, totale: 0, transazioni: [] };
      voce.totale += tr.tipo === 'entrata' ? tr.importo : -tr.importo;
      voce.transazioni.push(tr);
      mappa.set(categoria.id, voce);
    }
    return Array.from(mappa.values()).sort((a, b) => Math.abs(b.totale) - Math.abs(a.totale));
  }, [transazioniOrdinate, categorie]);

  // Prossimi pagamenti ricorrenti attesi nel mese: stessa logica di "giorno atteso" usata in
  // applicaRicorrenti (store/financeStore/transazioniSlice.ts). Ha senso solo mentre si guarda il
  // mese corrente reale — "prossimo" non significa nulla navigando su un mese passato o futuro
  const prossimeRicorrenze = useMemo(() => {
    const oggi = new Date();
    const isMeseCorrente = periodo === 'mensile'
      && dataCorrente.getFullYear() === oggi.getFullYear()
      && dataCorrente.getMonth() === oggi.getMonth();
    if (!isMeseCorrente) return [];

    const maxGiorno = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0).getDate();

    return transazioni
      .filter((tr) => tr.ricorrente)
      .map((tr) => {
        const giornoOriginale = new Date(tr.data + 'T00:00:00').getDate();
        const giorno = Math.min(giornoOriginale, maxGiorno);
        return { transazione: tr, giorno };
      })
      .filter(({ giorno, transazione }) => {
        if (giorno < oggi.getDate()) return false;
        if (transazione.dataFine && transazione.dataFine < oggiIso()) return false;
        return true;
      })
      .sort((a, b) => a.giorno - b.giorno);
  }, [transazioni, periodo, dataCorrente]);

  // "Disponibile oggi" (stile PocketGuard "In My Pocket"): quanto puoi spendere liberamente
  // ora senza intaccare soldi già impegnati. Parte dall'avanzo attuale (reddito meno quanto
  // già speso questo mese) e sottrae due cose non ancora "spese" ma già impegnate:
  // - le ricorrenze manuali (senza data fine) ancora da applicare questo mese: quelle CON data
  //   fine hanno già una transazione reale generata alla creazione, quindi sono già dentro
  //   l'avanzo e sottrarle di nuovo le conterebbe due volte;
  // - il budget assegnato ma non ancora speso nelle categorie pianificate (Pianifica → Budget).
  const disponibileOggi = useMemo(() => {
    const oggi = new Date();
    const isMeseCorrente = periodo === 'mensile'
      && dataCorrente.getFullYear() === oggi.getFullYear()
      && dataCorrente.getMonth() === oggi.getMonth();
    if (!isMeseCorrente || reddito <= 0) return null;

    const ricorrenzeDaPagare = prossimeRicorrenze
      .filter(({ transazione }) => transazione.tipo === 'uscita' && !transazione.dataFine)
      .reduce((s, { transazione }) => s + transazione.importo, 0);

    const budgetNonSpeso = calcolaRigheBudget(transazioni, categorie, dataCorrente.getFullYear(), dataCorrente.getMonth())
      .reduce((s, r) => s + Math.max(r.disponibile, 0), 0);

    return avanzo - ricorrenzeDaPagare - budgetNonSpeso;
  }, [periodo, dataCorrente, reddito, prossimeRicorrenze, avanzo, transazioni, categorie]);

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
        .filter((tr) => !tr.ricorrente && !tr.trasferimento && tr.tipo === 'uscita' && tr.data.startsWith(chiave))
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

  // Entrate/uscite separate del mese precedente, per la card di confronto mensile
  const confrontoMesePrecedente = useMemo(() => {
    if (periodo !== 'mensile') return null;
    const d = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth() - 1, 1);
    const chiave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const delMese = transazioni.filter((tr) => !tr.ricorrente && !tr.trasferimento && tr.data.startsWith(chiave));
    return {
      entrate: delMese.filter((tr) => tr.tipo === 'entrata').reduce((s, tr) => s + tr.importo, 0),
      uscite:  delMese.filter((tr) => tr.tipo === 'uscita').reduce((s, tr) => s + tr.importo, 0),
    };
  }, [periodo, dataCorrente, transazioni]);

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
    <ContenitoreScheda style={stili.contenitore}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primario} colors={[t.primario]} />}
      >
        <ControlliPeriodo
          periodo={periodo}
          onCambiaPeriodo={setPeriodo}
          periodoLabel={periodoLabel}
          onNaviga={naviga}
          onBackup={gestisciBackup}
          onCiclaTema={ciclaTema}
          iconaTema={iconaTema}
        />

        <CardSaldo
          periodo={periodo}
          saldo={saldo}
          totaleEntrate={totaleEntrate}
          totaleUscite={totaleUscite}
          variazioneSaldo={variazioneSaldo}
          nomeMesePrecedenteBreve={nomeMesePrecedenteBreve}
          coloriGradiente={coloriGradiente}
        />

        {disponibileOggi != null && <DisponibileOggiCard disponibileOggi={disponibileOggi} />}

        <CruscottoFlusso
          periodo={periodo}
          reddito={reddito}
          redditoRiferimento={redditoRiferimento}
          totaleInvestimenti={totaleInvestimenti}
          totaleFisse={totaleFisse}
          totaleVariabili={totaleVariabili}
          avanzo={avanzo}
          livelloRisparmio={livelloRisparmio}
          onApriModaleReddito={apriModaleReddito}
        />

        {prossimeRicorrenze.length > 0 && (
          <ProssimiPagamenti prossimeRicorrenze={prossimeRicorrenze} categorie={categorie} />
        )}

        {ultimi6MesiSaldi.some((d) => d.value !== 0) && (
          <TrendSaldoSparkline ultimi6MesiSaldi={ultimi6MesiSaldi} larghezza={LARGHEZZA} />
        )}

        {totaleUscite > 0 && (
          <StatisticheAvanzate
            totaleUscite={totaleUscite}
            mediaGiornaliera={mediaGiornaliera}
            differenzaMediaPerc={differenzaMediaPerc}
            topCategorieSpesa={topCategorieSpesa}
          />
        )}

        {confrontoMesePrecedente != null && (totaleEntrate > 0 || totaleUscite > 0) && (
          <ConfrontoMesePrecedente
            totaleEntrate={totaleEntrate}
            totaleUscite={totaleUscite}
            confrontoMesePrecedente={confrontoMesePrecedente}
            nomeMesePrecedenteBreve={nomeMesePrecedenteBreve}
          />
        )}

        <ListaCategorieGruppo
          gruppiPerCategoria={gruppiPerCategoria}
          onSelezionaCategoria={setCategoriaDettaglio}
        />

      </ScrollView>

      <ModaleDettaglioCategoria
        categoriaDettaglio={categoriaDettaglio}
        gruppiPerCategoria={gruppiPerCategoria}
        istituti={istituti}
        onChiudi={() => setCategoriaDettaglio(undefined)}
      />

      <ModaleReddito
        visibile={modaleReddito}
        redditoInput={redditoInput}
        onChangeText={setRedditoInput}
        onAnnulla={() => setModaleReddito(false)}
        onSalva={salvaReddito}
      />

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
        onSalvaTrasferimento={aggiungiTrasferimento}
        onSalvaDivisa={importaTransazioni}
        onCaricaFoto={caricaFotoScontrino}
        categorie={categorie}
        istituti={istituti}
      />
    </ContenitoreScheda>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },
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
  });
}
