// ── Sotto-schermata "Guida": spiegazione completa e rivisitabile di ogni parte dell'app ──
import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, TouchableOpacity, UIManager, View, StyleSheet } from 'react-native';
import Text from '../../../components/TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Tema } from '../../../constants/tema';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IoniconName = keyof typeof Ionicons.glyphMap;

interface Voce {
  icona: IoniconName;
  titolo: string;
  testo: string;
}

const SEZIONI: Voce[] = [
  {
    icona: 'list-outline',
    titolo: 'Movimenti',
    testo:
      "Registra ogni entrata o uscita con il pulsante “+”: importo, categoria, data, conto/carta, nota, tag e — se vuoi — la foto dello scontrino. " +
      'Dalla lista puoi cercare, filtrare per periodo, modificare, duplicare o eliminare una transazione, ed esportare tutto in CSV. ' +
      'Da qui puoi anche registrare un trasferimento tra due conti: viene creato come una coppia di movimenti collegati (uscita dal conto di origine, entrata su quello di destinazione) e non conta come vera entrata/uscita nei totali.',
  },
  {
    icona: 'wallet-outline',
    titolo: 'Riepilogo',
    testo:
      'La schermata principale con saldo, entrate e uscite del periodo selezionato (mensile o annuale). ' +
      'Il cruscotto “Flusso” confronta il tuo reddito con spese fisse, variabili e investimenti, e calcola quanto risparmi. ' +
      'Più sotto trovi il trend degli ultimi 6 mesi, qualche statistica (media di spesa giornaliera, confronto con i mesi precedenti) e le transazioni raggruppate per categoria — toccane una per vedere il dettaglio.',
  },
  {
    icona: 'analytics-outline',
    titolo: 'Analisi',
    testo:
      'Grafici per capire dove vanno i tuoi soldi: la torta mostra la ripartizione delle spese per categoria (tocca una fetta per il dettaglio), gli istogrammi mostrano l’andamento mese per mese o anno per anno. Sono tutti interattivi: tocca o trascina per vedere i valori esatti.',
  },
  {
    icona: 'pie-chart-outline',
    titolo: 'Pianifica → Budget',
    testo:
      'Assegna un budget mensile alle categorie che vuoi tenere sotto controllo (dalla schermata Categorie). Qui vedi quanto hai speso rispetto al budget di ogni categoria, mese per mese. ' +
      'Se attivi il “rollover” su una categoria, l’eventuale risparmio (o sforamento) del mese si somma al budget del mese successivo invece di azzerarsi.',
  },
  {
    icona: 'repeat-outline',
    titolo: 'Pianifica → Ricorrenti',
    testo:
      'Per spese o entrate fisse (stipendio, affitto, abbonamenti…) attiva “Ricorrente” nel form di una transazione e scegli una data di fine: l’app genera subito tutte le transazioni mensili fino a quella data, così le vedi già nei conteggi di ogni mese. ' +
      'Se invece lasci vuota la data di fine, il modello resta “manuale”: dovrai tornare qui ogni mese e usare “Applica al mese” per creare la transazione di quel mese specifico.',
  },
  {
    icona: 'trophy-outline',
    titolo: 'Pianifica → Obiettivi',
    testo:
      'Crea salvadanai virtuali per i tuoi risparmi (es. vacanza, fondo emergenze): imposta un importo obiettivo, una scadenza facoltativa e aggiorna l’importo accantonato quando vuoi. La barra di avanzamento e la stima del completamento ti aiutano a capire se sei in linea con i tempi.',
  },
  {
    icona: 'pricetags-outline',
    titolo: 'Categorie',
    testo:
      'Crea, rinomina ed elimina le categorie di entrata/uscita, scegli un colore e un tipo — fissa, variabile o investimento — usato dal cruscotto Flusso in Riepilogo per dividere le spese. Da qui imposti anche il budget mensile ed eventuale rollover di ciascuna categoria (visibili poi in Pianifica → Budget).',
  },
  {
    icona: 'business-outline',
    titolo: 'Conti & Istituti',
    testo:
      'Gestisci i conti correnti e le carte di credito su cui registri i movimenti. Avendo almeno due conti, dalla schermata Movimenti o Riepilogo puoi anche registrare un trasferimento diretto tra due di essi.',
  },
  {
    icona: 'lock-closed-outline',
    titolo: 'Sicurezza',
    testo:
      'In Impostazioni puoi proteggere l’app con un PIN a 4 cifre e, se il dispositivo lo supporta, con lo sblocco biometrico (impronta o volto). L’app si blocca automaticamente quando torna in background.',
  },
  {
    icona: 'notifications-outline',
    titolo: 'Notifiche',
    testo:
      'Attivale in Impostazioni per ricevere un avviso quando superi il budget di una categoria e un promemoria per applicare le transazioni ricorrenti manuali del mese. Non disponibili sul web.',
  },
  {
    icona: 'cloud-download-outline',
    titolo: 'Backup & Import',
    testo:
      'Da Riepilogo o Impostazioni puoi esportare un backup completo in JSON con tutti i tuoi dati (transazioni, categorie, conti, obiettivi). Da Impostazioni puoi anche importare movimenti da un file CSV — utile per portare dati da un’altra app.',
  },
  {
    icona: 'contrast-outline',
    titolo: 'Tema',
    testo: 'Scegli tra tema Chiaro, Scuro o Sistema (segue automaticamente le impostazioni del telefono) dal pulsante in alto in Riepilogo oppure da Impostazioni.',
  },
];

export default function GuidaScreen() {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);
  const [espansa, setEspansa] = useState<number | undefined>(0);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEspansa((prev) => (prev === i ? undefined : i));
  };

  return (
    <ScrollView style={[stili.contenitore, { backgroundColor: t.sfondo }]} contentContainerStyle={stili.contenuto}>
      <Text style={stili.intro}>
        Come funziona AppBudget, sezione per sezione. Tocca una voce per aprirla.
      </Text>

      {SEZIONI.map((voce, i) => {
        const aperta = espansa === i;
        return (
          <View key={voce.titolo} style={stili.card}>
            <TouchableOpacity style={stili.intestazione} onPress={() => toggle(i)} activeOpacity={0.7}>
              <View style={stili.cerchioIcona}>
                <Ionicons name={voce.icona} size={18} color={t.primario} />
              </View>
              <Text style={stili.titolo}>{voce.titolo}</Text>
              <Ionicons name={aperta ? 'chevron-up' : 'chevron-down'} size={18} color={t.piuSottile} />
            </TouchableOpacity>
            {aperta && <Text style={stili.testo}>{voce.testo}</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
    },
    contenuto: {
      padding: 16,
      paddingBottom: 40,
      gap: 10,
    },
    intro: {
      fontSize: 13,
      color: t.sottile,
      marginBottom: 4,
      lineHeight: 19,
    },
    card: {
      backgroundColor: t.carta,
      borderRadius: 18,
      padding: 4,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    intestazione: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
    },
    cerchioIcona: {
      width: 34,
      height: 34,
      borderRadius: 20,
      backgroundColor: t.primarioSfondo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titolo: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: t.titolo,
    },
    testo: {
      fontSize: 13.5,
      color: t.corpo,
      lineHeight: 20,
      paddingHorizontal: 12,
      paddingBottom: 14,
      paddingTop: 2,
    },
  });
}
