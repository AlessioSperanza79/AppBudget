// ── Schermata di blocco a PIN/biometria mostrata sopra tutta l'app quando è attiva ──
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './TestoBase';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSicurezza } from '../store/useSicurezza';
import { useTema, Tema, FONT_ESPRESSIVO } from '../constants/tema';

const LUNGHEZZA_PIN = 4;
// '' → riservato al tasto biometria (o vuoto), 'backspace' → cancella l'ultima cifra
const TASTI = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

interface ProprietaAppLock {
  bloccato: boolean;
  onSbloccato: () => void;
}

export default function AppLock({ bloccato, onSbloccato }: ProprietaAppLock) {
  const pinHash = useSicurezza((s) => s.pinHash);
  const biometriaAttiva = useSicurezza((s) => s.biometriaAttiva);
  const verificaPin = useSicurezza((s) => s.verificaPin);

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [pin, setPin] = useState('');
  const [errore, setErrore] = useState(false);
  const scuotimento = useRef(new Animated.Value(0)).current;
  const biometriaInCorso = useRef(false);

  // La biometria non è disponibile nei browser web: lì resta solo il PIN
  const biometriaUtilizzabile = Platform.OS !== 'web' && biometriaAttiva;

  const provaBiometria = async () => {
    if (biometriaInCorso.current) return;
    biometriaInCorso.current = true;
    try {
      const esito = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sblocca AppBudget',
        cancelLabel: 'Usa il PIN',
      });
      if (esito.success) onSbloccato();
    } finally {
      biometriaInCorso.current = false;
    }
  };

  // Ad ogni ri-comparsa del blocco: pulisce il PIN e propone subito la biometria — ma solo se
  // l'app è già in primo piano. Il blocco scatta anche nell'istante in cui l'app va in
  // background (schermo che si spegne): avviare lì la richiesta biometrica nativa la lascia
  // "appesa" finché l'app non torna attiva, e nel frattempo anche "Riprova" resta bloccato
  // dalla guardia biometriaInCorso, che non si sblocca mai.
  useEffect(() => {
    if (!bloccato) return;
    setPin('');
    setErrore(false);
    if (biometriaUtilizzabile && AppState.currentState === 'active') provaBiometria();
  }, [bloccato]);

  // Quando l'app torna in primo piano con il blocco ancora attivo, ripropone la biometria:
  // copre sia il caso "bloccato durante il background" sopra sia un eventuale tentativo
  // rimasto appeso, azzerando la guardia prima di riprovare
  useEffect(() => {
    if (!biometriaUtilizzabile) return;
    const sub = AppState.addEventListener('change', (stato) => {
      if (stato === 'active' && bloccato) {
        biometriaInCorso.current = false;
        provaBiometria();
      }
    });
    return () => sub.remove();
  }, [bloccato, biometriaUtilizzabile]);

  // Tocco esplicito dell'utente su "Riprova" o sul tasto impronta: azzera sempre la guardia,
  // così un tentativo automatico rimasto appeso non blocca per sempre anche il tentativo manuale
  const riprovaBiometria = () => {
    biometriaInCorso.current = false;
    provaBiometria();
  };

  useEffect(() => {
    if (pin.length < LUNGHEZZA_PIN) return;
    let annullato = false;
    verificaPin(pin).then((ok) => {
      if (annullato) return;
      if (ok) {
        onSbloccato();
      } else {
        setErrore(true);
        Animated.sequence([
          Animated.timing(scuotimento, { toValue: 8, duration: 45, useNativeDriver: true }),
          Animated.timing(scuotimento, { toValue: -8, duration: 45, useNativeDriver: true }),
          Animated.timing(scuotimento, { toValue: 8, duration: 45, useNativeDriver: true }),
          Animated.timing(scuotimento, { toValue: 0, duration: 45, useNativeDriver: true }),
        ]).start(() => {
          setPin('');
          setErrore(false);
        });
      }
    });
    return () => { annullato = true; };
  }, [pin]);

  if (!bloccato || !(pinHash || biometriaAttiva)) return null;

  const premiTasto = (tasto: string) => {
    if (tasto === 'backspace') setPin((p) => p.slice(0, -1));
    else if (tasto !== '') setPin((p) => (p.length < LUNGHEZZA_PIN ? p + tasto : p));
  };

  // Nessun PIN impostato: l'unico metodo di sblocco è la biometria, niente tastiera numerica
  if (!pinHash) {
    return (
      <View style={stili.overlay}>
        <View style={stili.contenuto}>
          <View style={stili.iconaCerchio}>
            <Ionicons name="finger-print" size={26} color={t.primario} />
          </View>
          <Text style={stili.titolo}>Autenticazione richiesta</Text>
          <Text style={stili.sottotitolo}>Usa l&apos;impronta o il Face ID per sbloccare AppBudget</Text>
          <TouchableOpacity style={stili.btnRiprova} onPress={riprovaBiometria}>
            <Text style={stili.testoBtnRiprova}>Riprova</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={stili.overlay}>
      <View style={stili.contenuto}>
        <View style={stili.iconaCerchio}>
          <Ionicons name="lock-closed" size={26} color={t.primario} />
        </View>
        <Text style={stili.titolo}>{errore ? 'PIN errato' : 'Inserisci il PIN'}</Text>

        <Animated.View style={[stili.rigaDot, { transform: [{ translateX: scuotimento }] }]}>
          {Array.from({ length: LUNGHEZZA_PIN }).map((_, i) => (
            <View
              key={i}
              style={[stili.dot, i < pin.length && stili.dotPieno, errore && stili.dotErrore]}
            />
          ))}
        </Animated.View>

        <View style={stili.tastiera}>
          {TASTI.map((tasto, i) => {
            if (tasto === '') {
              return biometriaUtilizzabile ? (
                <TouchableOpacity key={i} style={stili.tasto} onPress={riprovaBiometria}>
                  <Ionicons name="finger-print" size={26} color={t.primario} />
                </TouchableOpacity>
              ) : (
                <View key={i} style={stili.tasto} />
              );
            }
            if (tasto === 'backspace') {
              return (
                <TouchableOpacity key={i} style={stili.tasto} onPress={() => premiTasto(tasto)}>
                  <Ionicons name="backspace-outline" size={22} color={t.corpo} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity key={i} style={stili.tasto} onPress={() => premiTasto(tasto)}>
                <Text style={stili.testoTasto}>{tasto}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: t.sfondo,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      elevation: 1000,
    },
    contenuto: {
      alignItems: 'center',
      gap: 10,
    },
    iconaCerchio: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.primarioSfondo,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    titolo: {
      fontSize: 16,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 8,
    },
    sottotitolo: {
      fontSize: 13,
      color: t.sottile,
      textAlign: 'center',
      maxWidth: 240,
      marginTop: -4,
      marginBottom: 24,
    },
    btnRiprova: {
      paddingVertical: 12,
      paddingHorizontal: 28,
      borderRadius: 14,
      backgroundColor: t.primario,
    },
    testoBtnRiprova: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    rigaDot: {
      flexDirection: 'row',
      gap: 14,
      marginBottom: 32,
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.sfondoInput,
    },
    dotPieno: {
      backgroundColor: t.primario,
      borderColor: t.primario,
    },
    dotErrore: {
      backgroundColor: t.uscita,
      borderColor: t.uscita,
    },
    tastiera: {
      width: 260,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    tasto: {
      width: 72,
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    testoTasto: {
      fontSize: 24,
      fontWeight: '600',
      fontFamily: FONT_ESPRESSIVO,
      color: t.titolo,
    },
  });
}
