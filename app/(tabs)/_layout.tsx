import { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const SCHEDE: {
  nome: string;
  titolo: string;
  icona: IoniconName;
  colore: string;
}[] = [
  { nome: 'riepilogo',      titolo: 'Riepilogo',   icona: 'wallet',            colore: '#16A34A' },
  { nome: 'index',          titolo: 'Transazioni', icona: 'list',              colore: '#2563EB' },
  { nome: 'grafici',        titolo: 'Grafici',      icona: 'pie-chart',         colore: '#7C3AED' },
  { nome: 'analisi',        titolo: 'Analisi',      icona: 'analytics',         colore: '#F97316' },
  { nome: 'pianificazione', titolo: 'Pianifica',    icona: 'calendar-outline',  colore: '#0891B2' },
  { nome: 'categorie',      titolo: 'Categorie',   icona: 'pricetags',         colore: '#DC2626' },
];

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="riepilogo"
      screenOptions={{
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      {SCHEDE.map(({ nome, titolo, icona, colore }) => (
        <Tabs.Screen
          key={nome}
          name={nome}
          options={{
            title: titolo,
            tabBarActiveTintColor: colore,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={icona} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
