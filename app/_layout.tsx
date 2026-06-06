import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { usePreferenze } from '@/store/usePreferenze';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Blocca la splash screen finché font e dati Supabase non sono pronti
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const caricaDati = useFinanceStore((s) => s.caricaDati);
  const avviaRealtime = useFinanceStore((s) => s.avviaRealtime);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    // Carica i dati dal db, poi mostra l'app; avvia anche la sync in tempo reale
    caricaDati().then(() => SplashScreen.hideAsync());
    return avviaRealtime();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const pref = usePreferenze((s) => s.tema);
  const isDark = pref === 'scuro' || (pref === 'sistema' && colorScheme === 'dark');

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* headerShown: false → i singoli schermi gestiscono i propri header */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
