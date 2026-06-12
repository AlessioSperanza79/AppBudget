import { ComponentProps } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { luce, buio } from '@/constants/tema';
import { usePreferenze } from '@/store/usePreferenze';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const SCHEDE: { nome: string; titolo: string; icona: IoniconName }[] = [
  { nome: 'riepilogo',      titolo: 'Riepilogo',   icona: 'wallet-outline' },
  { nome: 'index',          titolo: 'Movimenti',   icona: 'list-outline' },
  { nome: 'grafici',        titolo: 'Grafici',     icona: 'pie-chart-outline' },
  { nome: 'analisi',        titolo: 'Analisi',     icona: 'analytics-outline' },
  { nome: 'pianificazione', titolo: 'Pianifica',   icona: 'calendar-outline' },
  { nome: 'obiettivi',      titolo: 'Obiettivi',   icona: 'flag-outline' },
  { nome: 'categorie',      titolo: 'Categorie',   icona: 'pricetags-outline' },
];

export default function TabLayout() {
  const schema = useColorScheme();
  const pref = usePreferenze((s) => s.tema);
  const isDark = pref === 'scuro' || (pref === 'sistema' && schema === 'dark');
  const t = isDark ? buio : luce;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="riepilogo"
      screenOptions={{
        headerShown: false,
        contentStyle: { paddingTop: insets.top, backgroundColor: t.sfondo },
        tabBarActiveTintColor: t.primario,
        tabBarInactiveTintColor: t.piuSottile,
        tabBarStyle: {
          backgroundColor: t.carta,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.bordo,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 80 : 58 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 22 : insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: -2,
        },
      }}
    >
      {SCHEDE.map(({ nome, titolo, icona }) => (
        <Tabs.Screen
          key={nome}
          name={nome}
          options={{
            title: titolo,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={icona} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
