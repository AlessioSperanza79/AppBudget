// ── Sezione "Sicurezza" della schermata Altro: blocco con PIN e sblocco biometrico ──
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSicurezza } from '../../store/useSicurezza';
import { useTema, Tema } from '../../constants/tema';
import BottomSheet from '../BottomSheet';
import ConfermaDialog from '../ConfermaDialog';

const LUNGHEZZA_PIN = 4;

export default function SicurezzaSezione() {
  const pinHash = useSicurezza((s) => s.pinHash);
  const biometriaAttiva = useSicurezza((s) => s.biometriaAttiva);
  const impostaPin = useSicurezza((s) => s.impostaPin);
  const disattivaBlocco = useSicurezza((s) => s.disattivaBlocco);
  const setBiometriaAttiva = useSicurezza((s) => s.setBiometriaAttiva);

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  // La biometria non esiste sul web; su native va comunque verificato che il dispositivo
  // abbia hardware compatibile e almeno un'impronta/volto già registrato nel sistema
  const [biometriaSupportata, setBiometriaSupportata] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const iscritta = await LocalAuthentication.isEnrolledAsync();
      setBiometriaSupportata(hw && iscritta);
    })();
  }, []);

  const [modaleAperto, setModaleAperto] = useState(false);
  const [nuovoPin, setNuovoPin] = useState('');
  const [confermaPin, setConfermaPin] = useState('');
  const [erroreForm, setErroreForm] = useState('');
  const [confermaDisattiva, setConfermaDisattiva] = useState(false);

  const apriImpostaPin = () => {
    setNuovoPin('');
    setConfermaPin('');
    setErroreForm('');
    setModaleAperto(true);
  };

  const salvaPin = async () => {
    if (nuovoPin.length !== LUNGHEZZA_PIN) {
      setErroreForm(`Il PIN deve avere ${LUNGHEZZA_PIN} cifre`);
      return;
    }
    if (nuovoPin !== confermaPin) {
      setErroreForm('I due PIN non coincidono');
      return;
    }
    await impostaPin(nuovoPin);
    setModaleAperto(false);
  };

  const gestisciToggleBlocco = (attivo: boolean) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (attivo) apriImpostaPin();
    else setConfermaDisattiva(true);
  };

  const gestisciToggleBiometria = async (attivo: boolean) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!attivo) { setBiometriaAttiva(false); return; }
    // Richiede subito un'autenticazione di prova: se fallisce/annulla, il toggle resta spento
    const esito = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Conferma per attivare lo sblocco rapido',
    });
    if (esito.success) setBiometriaAttiva(true);
  };

  return (
    <View style={stili.contenitore}>
      <Text style={stili.titoloSezione}>Sicurezza</Text>

      <View style={stili.riga}>
        <View style={{ flex: 1 }}>
          <Text style={stili.etichettaRiga}>Blocco con PIN</Text>
          <Text style={stili.descrizioneRiga}>Richiede il PIN all&apos;apertura dell&apos;app</Text>
        </View>
        <Switch value={!!pinHash} onValueChange={gestisciToggleBlocco} trackColor={{ true: t.primario }} />
      </View>

      {!!pinHash && (
        <TouchableOpacity style={stili.rigaAzione} onPress={apriImpostaPin}>
          <Ionicons name="key-outline" size={18} color={t.primario} />
          <Text style={stili.testoRigaAzione}>Cambia PIN</Text>
        </TouchableOpacity>
      )}

      {/* Indipendente dal PIN: si può usare solo la biometria, solo il PIN, o entrambi */}
      {biometriaSupportata && (
        <View style={stili.riga}>
          <View style={{ flex: 1 }}>
            <Text style={stili.etichettaRiga}>Sblocco con impronta/Face ID</Text>
            <Text style={stili.descrizioneRiga}>Richiede la biometria all&apos;apertura dell&apos;app</Text>
          </View>
          <Switch value={biometriaAttiva} onValueChange={gestisciToggleBiometria} trackColor={{ true: t.primario }} />
        </View>
      )}

      {/* ── Modal imposta/cambia PIN ── */}
      <BottomSheet visibile={modaleAperto} onChiudi={() => setModaleAperto(false)}>
        <View style={stili.corpoModal}>
          <Text style={stili.titoloModal}>{pinHash ? 'Cambia PIN' : 'Imposta un PIN'}</Text>

          <Text style={stili.etichetta}>Nuovo PIN ({LUNGHEZZA_PIN} cifre)</Text>
          <TextInput
            style={stili.input}
            value={nuovoPin}
            onChangeText={(v) => setNuovoPin(v.replace(/\D/g, '').slice(0, LUNGHEZZA_PIN))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={LUNGHEZZA_PIN}
          />

          <Text style={stili.etichetta}>Conferma PIN</Text>
          <TextInput
            style={stili.input}
            value={confermaPin}
            onChangeText={(v) => setConfermaPin(v.replace(/\D/g, '').slice(0, LUNGHEZZA_PIN))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={LUNGHEZZA_PIN}
          />

          {!!erroreForm && <Text style={stili.testoErrore}>{erroreForm}</Text>}

          <View style={stili.rigaBottoni}>
            <TouchableOpacity style={stili.btnAnnulla} onPress={() => setModaleAperto(false)}>
              <Text style={stili.testoAnnulla}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={stili.btnConferma} onPress={salvaPin}>
              <Text style={stili.testoConferma}>Salva</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      {/* ── Conferma disattivazione ── */}
      <ConfermaDialog
        visibile={confermaDisattiva}
        onChiudi={() => setConfermaDisattiva(false)}
        titolo="Disattiva blocco"
        messaggio="Vuoi disattivare il blocco con PIN? Chiunque apra l'app potrà vedere i tuoi dati."
        onConferma={() => { disattivaBlocco(); setConfermaDisattiva(false); }}
      />
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      backgroundColor: t.carta,
      margin: 16,
      marginBottom: 4,
      borderRadius: 24,
      padding: 18,
      gap: 14,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    titoloSezione: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    riga: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    etichettaRiga: {
      fontSize: 14,
      fontWeight: '500',
      color: t.corpo,
    },
    descrizioneRiga: {
      fontSize: 12,
      color: t.piuSottile,
      marginTop: 2,
    },
    rigaAzione: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    testoRigaAzione: {
      fontSize: 14,
      fontWeight: '600',
      color: t.primario,
    },

    // ── Modal ──
    corpoModal: {
      paddingHorizontal: 24,
      paddingTop: 4,
      paddingBottom: 28,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 4,
    },
    etichetta: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      marginTop: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 12,
      padding: 13,
      fontSize: 15,
      color: t.titolo,
      backgroundColor: t.sfondoInput,
      letterSpacing: 4,
    },
    testoErrore: {
      color: t.uscita,
      fontSize: 13,
      marginTop: 10,
    },
    rigaBottoni: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    btnAnnulla: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.bordo,
      alignItems: 'center',
    },
    testoAnnulla: {
      color: t.sottile,
      fontSize: 15,
      fontWeight: '600',
    },
    btnConferma: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: t.primario,
      alignItems: 'center',
    },
    testoConferma: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
