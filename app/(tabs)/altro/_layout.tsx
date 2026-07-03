// ── Stack della tab "Altro": hub + sotto-schermate (Impostazioni, Categorie, Conti & Istituti) ──
import { Stack } from 'expo-router';
import { useTema } from '../../../constants/tema';

export default function AltroLayout() {
  const t = useTema();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: t.carta },
        headerTintColor: t.primario,
        headerTitleStyle: { color: t.titolo, fontWeight: '700', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: t.sfondo },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Altro' }} />
      <Stack.Screen name="impostazioni" options={{ title: 'Impostazioni' }} />
      <Stack.Screen name="categorie" options={{ title: 'Categorie' }} />
      <Stack.Screen name="conti" options={{ title: 'Conti & Istituti' }} />
      <Stack.Screen name="patrimonio" options={{ title: 'Patrimonio' }} />
      <Stack.Screen name="guida" options={{ title: 'Guida' }} />
    </Stack>
  );
}
