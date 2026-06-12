// ── Tour introduttivo: spiega le schede principali dell'app al primo avvio (o su richiesta da "Aiuto") ──
import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FadeInView from '../FadeInView';
import PressableScale from '../PressableScale';
import { usePreferenze } from '../../store/usePreferenze';
import { Tema, useTema } from '../../constants/tema';

interface Diapositiva {
  icona: keyof typeof Ionicons.glyphMap;
  titolo: string;
  descrizione: string;
}

const DIAPOSITIVE: Diapositiva[] = [
  {
    icona: 'home-outline',
    titolo: 'Benvenuto in AppBudget',
    descrizione: "Tieni sotto controllo le tue finanze personali: entrate, uscite, ricorrenze e obiettivi, tutto in un'unica app.",
  },
  {
    icona: 'list-outline',
    titolo: 'Movimenti',
    descrizione: 'Registra ogni entrata e uscita in pochi tocchi, assegnandola a una categoria e a un conto.',
  },
  {
    icona: 'wallet-outline',
    titolo: 'Riepilogo',
    descrizione: "Visualizza saldo, flusso mensile e l'andamento degli ultimi mesi a colpo d'occhio.",
  },
  {
    icona: 'analytics-outline',
    titolo: 'Analisi',
    descrizione: 'Esplora grafici e tabelle per capire dove vanno i tuoi soldi, mese per mese o anno per anno.',
  },
  {
    icona: 'calendar-outline',
    titolo: 'Pianifica',
    descrizione: 'Gestisci le spese ricorrenti e monitora i tuoi obiettivi di risparmio.',
  },
  {
    icona: 'ellipsis-horizontal-outline',
    titolo: 'Altro',
    descrizione: 'Personalizza categorie, conti, tema e backup dei tuoi dati.',
  },
];

interface ProprietaTour {
  visibile: boolean;
  onChiudi: () => void;
}

export default function TourIntroduttivo({ visibile, onChiudi }: ProprietaTour) {
  const t = useTema();
  const stili = creaStili(t);
  const setTourCompletato = usePreferenze((s) => s.setTourCompletato);

  const [indice, setIndice] = useState(0);
  const [nonMostrarePiu, setNonMostrarePiu] = useState(true);

  const ultima = indice === DIAPOSITIVE.length - 1;
  const diapositiva = DIAPOSITIVE[indice];

  const chiudi = () => {
    setTourCompletato(nonMostrarePiu);
    setIndice(0);
    onChiudi();
  };

  const avanti = () => {
    if (ultima) {
      chiudi();
      return;
    }
    setIndice((i) => i + 1);
  };

  return (
    <Modal visible={visibile} animationType="fade" onRequestClose={chiudi}>
      <View style={stili.contenitore}>
        <View style={stili.intestazione}>
          <TouchableOpacity onPress={chiudi} hitSlop={10}>
            <Text style={stili.testoSalta}>Salta</Text>
          </TouchableOpacity>
        </View>

        <View style={stili.corpo}>
          <FadeInView key={indice} style={stili.corpoInterno}>
            <View style={stili.cerchioIcona}>
              <Ionicons name={diapositiva.icona} size={48} color={t.primario} />
            </View>
            <Text style={stili.titolo}>{diapositiva.titolo}</Text>
            <Text style={stili.descrizione}>{diapositiva.descrizione}</Text>
          </FadeInView>
        </View>

        <View style={stili.piedino}>
          <View style={stili.puntini}>
            {DIAPOSITIVE.map((_, i) => (
              <View key={i} style={[stili.puntino, i === indice && stili.puntinoAttivo]} />
            ))}
          </View>

          <TouchableOpacity style={stili.rigaCheckbox} onPress={() => setNonMostrarePiu((v) => !v)} hitSlop={8}>
            <View style={[stili.checkbox, nonMostrarePiu && stili.checkboxAttivo]}>
              {nonMostrarePiu && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={stili.testoCheckbox}>Non mostrare più</Text>
          </TouchableOpacity>

          <PressableScale onPress={avanti}>
            <LinearGradient
              colors={[t.primario, t.viola]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={stili.btnAvanti}
            >
              <Text style={stili.testoBtnAvanti}>{ultima ? 'Inizia' : 'Avanti'}</Text>
            </LinearGradient>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },
    intestazione: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingTop: 56,
      paddingHorizontal: 24,
    },
    testoSalta: {
      fontSize: 15,
      fontWeight: '600',
      color: t.piuSottile,
    },
    corpo: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    corpoInterno: {
      alignItems: 'center',
    },
    cerchioIcona: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: t.primarioSfondo,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    titolo: {
      fontSize: 26,
      fontWeight: '800',
      color: t.titolo,
      textAlign: 'center',
      marginBottom: 16,
    },
    descrizione: {
      fontSize: 16,
      color: t.sottile,
      textAlign: 'center',
      lineHeight: 24,
    },
    piedino: {
      paddingHorizontal: 24,
      paddingBottom: 32,
      gap: 20,
      alignItems: 'center',
    },
    puntini: {
      flexDirection: 'row',
      gap: 8,
    },
    puntino: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.bordo,
    },
    puntinoAttivo: {
      width: 24,
      backgroundColor: t.primario,
    },
    rigaCheckbox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: t.bordo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxAttivo: {
      backgroundColor: t.primario,
      borderColor: t.primario,
    },
    testoCheckbox: {
      fontSize: 14,
      color: t.sottile,
      fontWeight: '500',
    },
    btnAvanti: {
      width: '100%',
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    testoBtnAvanti: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
