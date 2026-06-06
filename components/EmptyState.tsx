import { useMemo, ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Tema } from '../constants/tema';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  messaggio: string;
  icona?: IoniconName;
}

export default function EmptyState({ messaggio, icona = 'document-text-outline' }: Props) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <View style={stili.contenitore}>
      <View style={stili.cerchio}>
        <Ionicons name={icona} size={32} color={t.piuSottile} />
      </View>
      <Text style={stili.testo}>{messaggio}</Text>
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      gap: 16,
    },
    cerchio: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.superfice,
      borderWidth: 1,
      borderColor: t.bordo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    testo: {
      fontSize: 15,
      color: t.sottile,
      textAlign: 'center',
      lineHeight: 23,
    },
  });
}
