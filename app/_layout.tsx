import { PlusJakartaSans_400Regular, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import AppLock from '@/components/AppLock';
import BarraCaricamento from '@/components/BarraCaricamento';
import NotificheManager from '@/components/NotificheManager';
import TourIntroduttivo from '@/components/onboarding/TourIntroduttivo';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { usePreferenze } from '@/store/usePreferenze';
import { useSicurezza } from '@/store/useSicurezza';
import { segnaSessioneSbloccata, sessioneGiaSbloccata } from '@/utils/sessioneWeb';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Blocca la splash screen finché font e dati Supabase non sono pronti
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    PlusJakartaSans_400Regular,
    PlusJakartaSans_800ExtraBold,
  });
  const caricaDati = useFinanceStore((s) => s.caricaDati);
  const avviaRealtime = useFinanceStore((s) => s.avviaRealtime);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    // Attende anche l'idratazione delle preferenze di sicurezza, per sapere già al primo
    // frame visibile se mostrare il blocco PIN (evita un flash di contenuto sbloccato)
    const idratazioneSicurezza = new Promise<void>((resolve) => {
      if (useSicurezza.persist.hasHydrated()) resolve();
      else useSicurezza.persist.onFinishHydration(() => resolve());
    });
    // Carica i dati dal db, poi mostra l'app; avvia anche la sync in tempo reale
    Promise.all([caricaDati(), idratazioneSicurezza]).then(() => SplashScreen.hideAsync());
    return avviaRealtime();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const pref = usePreferenze((s) => s.tema);
  const isDark = pref === 'scuro' || (pref === 'sistema' && colorScheme === 'dark');
  const [mostraTour, setMostraTour] = useState(false);

  useEffect(() => {
    // Attende l'idratazione di AsyncStorage prima di decidere se mostrare il tour,
    // per non lampeggiare la schermata a chi l'ha già completata
    const verifica = () => setMostraTour(!usePreferenze.getState().tourCompletato);
    if (usePreferenze.persist.hasHydrated()) verifica();
    return usePreferenze.persist.onFinishHydration(verifica);
  }, []);

  const pinHash = useSicurezza((s) => s.pinHash);
  const biometriaAttiva = useSicurezza((s) => s.biometriaAttiva);
  const bloccoAttivo = !!pinHash || biometriaAttiva;
  const [bloccato, setBloccato] = useState(true);

  useEffect(() => {
    // Stabilisce lo stato di blocco iniziale solo dopo l'idratazione (il valore vero
    // arriva qui appena pronto, mentre lo splash nasconde eventuali frame intermedi).
    // Sul web, se lo sblocco era già avvenuto in questa scheda del browser, non richiede
    // di nuovo il PIN: un refresh è un'azione frequente e involontaria, non un riavvio
    // deliberato come su mobile (dove il blocco a ogni avvio a freddo resta corretto).
    // Il blocco (PIN o biometria, indipendenti tra loro) scatta se almeno uno è attivo
    const applica = () => {
      const s = useSicurezza.getState();
      setBloccato((!!s.pinHash || s.biometriaAttiva) && !sessioneGiaSbloccata());
    };
    if (useSicurezza.persist.hasHydrated()) applica();
    return useSicurezza.persist.onFinishHydration(applica);
  }, []);

  useEffect(() => {
    // Ri-blocca quando l'app torna in background/inattiva (es. cambio app). Solo su native:
    // sul web lo stesso evento scatta anche solo cambiando scheda del browser, troppo spesso
    // per giustificare una nuova richiesta di PIN nella stessa sessione della pagina
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (stato) => {
      if ((stato === 'background' || stato === 'inactive') && bloccoAttivo) setBloccato(true);
    });
    return () => sub.remove();
  }, [bloccoAttivo]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <Stack>
            {/* headerShown: false → i singoli schermi gestiscono i propri header */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <TourIntroduttivo visibile={mostraTour} onChiudi={() => setMostraTour(false)} />
          <AppLock bloccato={bloccato} onSbloccato={() => { setBloccato(false); segnaSessioneSbloccata(); }} />
          <NotificheManager />
          <BarraCaricamento />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
