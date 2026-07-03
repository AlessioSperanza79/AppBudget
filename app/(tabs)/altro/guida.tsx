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
  intro?: string;
  punti: string[];
}

const SEZIONI: Voce[] = [
  {
    icona: 'list-outline',
    titolo: 'Movimenti',
    intro: 'La lista di tutte le transazioni, con ricerca e filtri.',
    punti: [
      'Mensile/Annuale in alto: cambia il periodo mostrato; le frecce ai lati spostano avanti/indietro di un mese o un anno.',
      'Barra di ricerca: cerca per testo nella nota, nel nome della categoria o nell\'importo. L\'icona a fianco apre filtri aggiuntivi (es. per categoria o conto), quella con la freccia esporta le transazioni del periodo in CSV.',
      'Lista transazioni: ogni riga mostra categoria e importo; toccala per aprire il dettaglio (data, conto, nota, tag, eventuale foto scontrino) con i pulsanti Duplica, Modifica ed Elimina.',
      'Pulsante “+”: apre il form per una nuova transazione — vedi la voce “Form nuova transazione” più sotto per il dettaglio di ogni campo.',
    ],
  },
  {
    icona: 'add-circle-outline',
    titolo: 'Form nuova transazione',
    intro: 'Lo stesso form compare dal “+” in Movimenti e in Riepilogo.',
    punti: [
      'Importo e Tipo (Uscita/Entrata): il segno viene applicato automaticamente in base al tipo scelto.',
      'Trasferimento: terza opzione al posto di Uscita/Entrata (visibile solo con almeno 2 conti) — sposta soldi tra due tuoi conti creando una coppia di movimenti collegati, che non conta come vera entrata/uscita nei totali.',
      'Divisione: attiva “Dividi in più categorie” per ripartire un unico importo (es. uno scontrino misto) su più categorie. Aggiungi righe categoria+importo: un indicatore mostra il “residuo da assegnare” e il salvataggio resta bloccato finché non torna a zero. Le transazioni create sono indipendenti (stessa data e nota, ma modificabili/eliminabili separatamente).',
      'Categoria: selezione a chip, disponibile quando non stai dividendo la transazione.',
      'Data, Tipologia conto (Conto corrente/Carta di credito) e Istituto: tutti facoltativi tranne la data.',
      'Nota e Tag: nota libera e un\'etichetta per raggruppare/filtrare (es. “Vacanze”).',
      'Foto scontrino: scatta o scegli dalla galleria (non disponibile se stai dividendo la transazione).',
      'Ricorrente: attivalo per spese/entrate fisse. Con una data di fine, l\'app genera subito tutte le transazioni mensili fino a quella data. Senza data di fine, il modello resta “manuale” e va applicato mese per mese da Pianifica → Ricorrenti.',
    ],
  },
  {
    icona: 'wallet-outline',
    titolo: 'Riepilogo',
    intro: 'La schermata principale, con lo stato delle tue finanze del periodo selezionato.',
    punti: [
      'Mensile/Annuale + navigatore: come in Movimenti, cambia il periodo di riferimento di tutta la schermata.',
      'Card Saldo: saldo del periodo con gradiente colorato (verde se positivo), il confronto “vs mese scorso” in alto, ed Entrate/Uscite totali sotto.',
      'Disponibile oggi: quanto puoi ancora spendere liberamente questo mese. Parte dal risparmio già accumulato e sottrae sia il budget assegnato ma non ancora speso nelle categorie pianificate, sia le ricorrenze manuali ancora da pagare — così non ti fa vedere come “liberi” soldi già impegnati.',
      'Flusso mensile: confronta il reddito impostato con le spese, divise in Investimenti, Spese fisse e Spese variabili (in base al tipo assegnato a ogni categoria); mostra il Risparmio risultante con un giudizio (Scarso/Buono/Eccellente…). Tocca la matita per impostare o modificare il reddito.',
      'Prossimi pagamenti: le transazioni ricorrenti attese entro fine mese (solo guardando il mese corrente).',
      'Trend saldo — ultimi 6 mesi: grafico a linea con il saldo mensile netto; trascina il dito per vedere il valore esatto di ogni mese.',
      'Statistiche: media di spesa giornaliera, confronto percentuale con la media degli ultimi 3 mesi, e le categorie con più spesa nel periodo.',
      'Confronto con il mese scorso: due barre per Entrate e Uscite, il valore corrente pieno e quello del mese precedente più chiaro.',
      'Categorie (elenco): ogni categoria del periodo con il totale netto; toccala per vedere tutte le transazioni di quella categoria in un popup.',
    ],
  },
  {
    icona: 'analytics-outline',
    titolo: 'Analisi → Grafici (vista mensile)',
    intro: 'Toggle “Grafici/Tabelle” in alto per scegliere la vista; questi sono i grafici del mese selezionato.',
    punti: [
      'Uscite per categoria: torta a ciambella con le spese del mese; tocca una fetta (o una voce della legenda sotto) per vedere nome, importo e percentuale sul totale al centro.',
      'Dettaglio categorie: le stesse categorie in barre orizzontali ordinate per importo, con percentuale sul totale.',
      'Confronto con il mese scorso: barre affiancate Entrate/Uscite di questo mese contro quelle del mese precedente; tocca una barra per il valore esatto.',
      'Flusso del denaro (Sankey): diagramma che mostra come le entrate si dividono tra le categorie di spesa e il risparmio — più una banda è spessa, maggiore la quota. Tocca una banda o una voce della legenda per il dettaglio (nome, importo, percentuale). Visibile solo se il mese ha un risparmio positivo.',
      'Cash flow settimanale: Entrate, Uscite e Saldo raggruppati per settimana del mese. Tocca una barra per il valore esatto.',
      'Saldo cumulativo: linea che accumula giorno per giorno entrate meno uscite dall\'inizio del mese, per vedere l\'andamento del saldo nel tempo.',
    ],
  },
  {
    icona: 'bar-chart-outline',
    titolo: 'Analisi → Grafici (vista annuale)',
    intro: 'Stesso toggle, con i dati aggregati per l\'intero anno selezionato.',
    punti: [
      'Entrate, Uscite e Saldo: tre barre per ciascun mese dell\'anno, per confrontarli tutti in un colpo d\'occhio.',
      'Trend risparmio mensile: linea con il risparmio (entrate meno uscite) di ogni mese dell\'anno.',
      'Confronto con l\'anno scorso: barre affiancate Entrate/Uscite dell\'anno corrente contro quello precedente.',
      'Flusso del denaro (Sankey): come nella vista mensile ma sui totali dell\'intero anno.',
      'Distribuzione uscite: torta con le categorie di spesa dell\'intero anno.',
      'Uscite per categoria: le stesse categorie in barre orizzontali ordinate per importo.',
    ],
  },
  {
    icona: 'grid-outline',
    titolo: 'Analisi → Tabelle',
    intro: 'Vista alternativa ai grafici: gli stessi dati in elenchi numerici, utile per un controllo puntuale.',
    punti: [
      'Uscite per categoria ed Entrate per categoria: elenco con importo totale e numero di transazioni per ciascuna categoria del periodo.',
      'Per istituto: entrate e uscite totali per ogni conto/carta usato nel periodo.',
      'Tocca una riga per aprire l\'elenco delle transazioni che la compongono.',
    ],
  },
  {
    icona: 'pie-chart-outline',
    titolo: 'Pianifica → Budget',
    intro: 'Piano di spesa mensile “a somma zero”, sul modello dell\'envelope budgeting.',
    punti: [
      'Card “Da assegnare”: reddito meno quanto già assegnato alle categorie; l\'obiettivo è farla arrivare a zero (“Ogni euro ha un compito”).',
      'Riga per categoria: barra con Speso/Assegnato e “Disponibile” (o “Sforato”) residuo; la matita apre l\'importo assegnato, l\'icona a ripetizione attiva il “rollover” — l\'avanzo (o lo sforamento) del mese si riporta su quello successivo invece di azzerarsi.',
      '“Aggiungi categoria al piano”: aggiunge al budget una categoria che non ne ha ancora uno.',
    ],
  },
  {
    icona: 'repeat-outline',
    titolo: 'Pianifica → Ricorrenti',
    intro: 'Gestione dei modelli di spesa/entrata fissa.',
    punti: [
      'Sembrano abbonamenti: l\'app individua spese manuali che si ripetono con cadenza mensile e importo simile (es. un abbonamento inserito ogni mese a mano) e le propone come ricorrenti. Toccane una per confermare: da quel momento verrà generata da sola ogni mese, senza toccare le transazioni già inserite in passato.',
      'Modelli: l\'elenco dei modelli ricorrenti attivi, con importo ed etichetta; tocca una riga per modificarla o eliminarla (eliminando un modello elimini anche tutte le transazioni che ha già generato).',
      '“Applica al mese”: compare solo per i modelli senza data di fine (manuali) — crea la transazione di quel mese per tutti quelli non ancora applicati.',
    ],
  },
  {
    icona: 'trophy-outline',
    titolo: 'Pianifica → Obiettivi',
    intro: 'Salvadanai virtuali per i tuoi risparmi (es. vacanza, fondo emergenze).',
    punti: [
      'Ogni obiettivo mostra una barra di avanzamento con importo accantonato su importo obiettivo, ed eventualmente la scadenza e una stima di quando lo raggiungerai al ritmo attuale.',
      '“Gestisci fondi”: versa o preleva dall\'importo accantonato in qualsiasi momento.',
      'La matita apre nome, importo obiettivo, colore e scadenza; il cestino elimina l\'obiettivo.',
    ],
  },
  {
    icona: 'pricetags-outline',
    titolo: 'Categorie',
    punti: [
      'Crea, rinomina ed elimina le categorie di entrata/uscita, e scegline il colore.',
      'Tipo (fissa/variabile/investimento): usato dal cruscotto “Flusso mensile” in Riepilogo per dividere le spese in tre gruppi.',
      'Budget mensile e rollover: impostabili qui, si riflettono in Pianifica → Budget e nell\'indicatore “Disponibile oggi” di Riepilogo.',
    ],
  },
  {
    icona: 'business-outline',
    titolo: 'Conti & Istituti',
    punti: [
      'Gestisci i conti correnti e le carte di credito su cui registri i movimenti.',
      'Avendo almeno due conti, dal form “+” di Movimenti o Riepilogo puoi anche registrare un trasferimento diretto tra due di essi.',
    ],
  },
  {
    icona: 'trending-up-outline',
    titolo: 'Patrimonio',
    intro: 'Il valore complessivo di quello che possiedi, non solo il flusso mensile di entrate/uscite.',
    punti: [
      'Card patrimonio netto: liquidità (calcolata automaticamente da tutte le transazioni registrate) più i tuoi beni, meno i tuoi debiti.',
      'Andamento nel tempo: grafico a linea con il patrimonio netto totale mese per mese — si aggiorna da solo ogni volta che apri questa schermata, così lo storico si costruisce automaticamente.',
      'Beni e Debiti: aggiungi voci manuali (es. casa, auto, conto deposito come bene; mutuo, prestito come debito) con nome, valore e colore; tocca la matita per modificarle o il cestino per eliminarle.',
    ],
  },
  {
    icona: 'lock-closed-outline',
    titolo: 'Sicurezza',
    punti: [
      'In Impostazioni puoi proteggere l\'app con un PIN a 4 cifre e, se il dispositivo lo supporta, con lo sblocco biometrico (impronta o volto).',
      'L\'app si blocca automaticamente quando torna in background e richiede di nuovo lo sblocco al ritorno in primo piano.',
    ],
  },
  {
    icona: 'notifications-outline',
    titolo: 'Notifiche',
    punti: [
      'Avviso quando superi il budget di una categoria pianificata.',
      'Promemoria per applicare le transazioni ricorrenti manuali del mese (quelle senza data di fine).',
      'Non disponibili sul web, solo su app installata.',
    ],
  },
  {
    icona: 'cloud-download-outline',
    titolo: 'Backup & Import',
    punti: [
      'Esporta backup JSON (da Riepilogo o Impostazioni): scarica un file con tutti i tuoi dati — transazioni, categorie, conti, obiettivi, patrimonio.',
      'Importa CSV (da Impostazioni): carica movimenti da un file CSV, utile per portare dati da un\'altra app o da un foglio di calcolo.',
    ],
  },
  {
    icona: 'contrast-outline',
    titolo: 'Tema',
    punti: [
      'Scegli tra Chiaro, Scuro o Sistema (segue automaticamente le impostazioni del telefono).',
      'Cambialo dal pulsante in alto in Riepilogo oppure da Impostazioni.',
    ],
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
        Come funziona AppBudget, grafico per grafico e sezione per sezione. Tocca una voce per aprirla.
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
            {aperta && (
              <View style={stili.corpoSezione}>
                {voce.intro && <Text style={stili.testoIntro}>{voce.intro}</Text>}
                {voce.punti.map((punto, j) => (
                  <View key={j} style={stili.rigaPunto}>
                    <View style={stili.pallinoPunto} />
                    <Text style={stili.testoPunto}>{punto}</Text>
                  </View>
                ))}
              </View>
            )}
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
    corpoSezione: {
      paddingHorizontal: 12,
      paddingBottom: 14,
      paddingTop: 2,
      gap: 8,
    },
    testoIntro: {
      fontSize: 13,
      color: t.sottile,
      fontStyle: 'italic',
      lineHeight: 19,
      marginBottom: 2,
    },
    rigaPunto: {
      flexDirection: 'row',
      gap: 8,
    },
    pallinoPunto: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: t.piuSottile,
      marginTop: 7,
      flexShrink: 0,
    },
    testoPunto: {
      flex: 1,
      fontSize: 13.5,
      color: t.corpo,
      lineHeight: 20,
    },
  });
}
