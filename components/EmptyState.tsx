import { ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  messaggio: string;
  icona?: IoniconName;
}

// Messaggio illustrato da mostrare quando una lista è vuota
export default function EmptyState({ messaggio, icona = 'document-text-outline' }: Props) {
  return (
    <View style={stili.contenitore}>
      <Ionicons name={icona} size={64} color="#DDD" />
      <Text style={stili.testo}>{messaggio}</Text>
    </View>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  testo: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 24,
  },
});
